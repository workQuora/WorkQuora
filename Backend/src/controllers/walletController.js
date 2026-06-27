const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createOrder, verifySignature, fetchPayment } = require('../services/razorpayService');
const { encrypt, decrypt } = require('../utils/encryption');

// Ensure wallet exists for user
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, userId, balance: 0 });
  }
  return wallet;
};

// @desc    Get current wallet balance
// @route   GET /api/v1/wallet/balance
// @access  Private
exports.getBalance = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance, // in paise
        formattedBalance: wallet.balance / 100,
        currency: 'INR',
        bankAccounts: wallet.bankAccounts.map(b => ({
          _id: b._id,
          bankName: b.bankName,
          accountEnding: b.accountNumber ? 'XXXX' + b.accountNumber.slice(-4) : '', // Assuming it might not be decrypted yet
          isPrimary: b.isPrimary
        }))
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Razorpay Order to add money to wallet
// @route   POST /api/v1/wallet/add-money/create-order
// @access  Private
exports.createAddMoneyOrder = async (req, res, next) => {
  try {
    const { amount } = req.body; // Amount in INR
    if (!amount || amount < 10 || amount > 100000) {
      return res.status(400).json({ success: false, message: 'Amount must be between ₹10 and ₹100,000' });
    }

    const amountInPaise = Math.round(amount * 100);
    const receipt = `add_money_${req.user.id}_${Date.now()}`;
    
    const order = await createOrder(amountInPaise, 'INR', receipt);

    // Create a pending transaction
    await WalletTransaction.create({
      userId: req.user.id,
      type: 'credit',
      source: 'add_money',
      amount: amountInPaise,
      status: 'pending',
      razorpayOrderId: order.id,
      description: 'Added money to wallet via Razorpay'
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('[AddMoney Create Order Error]', error);
    res.status(500).json({ success: false, message: 'Could not create payment order' });
  }
};

// @desc    Verify Razorpay Payment and credit wallet
// @route   POST /api/v1/wallet/add-money/verify
// @access  Private
exports.verifyAddMoneyPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    
    // Check idempotency: If this payment ID was already processed
    const existingTx = await WalletTransaction.findOne({ razorpayPaymentId, status: 'completed' }).session(session);
    if (existingTx) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ success: true, message: 'Payment already processed successfully' });
    }

    const isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      // Find the pending transaction and mark as failed if signature is bad
      await WalletTransaction.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'failed', razorpayPaymentId, description: 'Payment verification failed (signature mismatch)' },
        { session }
      );
      await session.commitTransaction(); // Save the failed state
      session.endSession();
      return res.status(400).json({ success: false, message: 'Payment verification failed — your wallet was not credited.' });
    }

    // Double-check with Razorpay directly
    const payment = await fetchPayment(razorpayPaymentId);
    if (!payment || payment.status !== 'captured') {
      await WalletTransaction.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'failed', razorpayPaymentId, description: `Payment verification failed (status: ${payment?.status})` },
        { session }
      );
      await session.commitTransaction(); // Save the failed state
      session.endSession();
      return res.status(400).json({ success: false, message: 'Payment not captured. If money was deducted, it will be refunded automatically.' });
    }

    // Use the amount returned by Razorpay directly (amount is in paise)
    const amountInPaise = payment.amount;

    const wallet = await Wallet.findOne({ userId: req.user.id }).session(session);
    if (!wallet) throw new Error('Wallet not found');

    // 1. Credit wallet
    wallet.balance += amountInPaise;
    await wallet.save({ session });

    // 2. Mark transaction as completed
    const transaction = await WalletTransaction.findOneAndUpdate(
      { razorpayOrderId, status: 'pending' },
      { status: 'completed', razorpayPaymentId, amount: amountInPaise },
      { new: true, session }
    );
    
    // If we didn't have a pending transaction to update, fallback to create
    let finalTx = transaction;
    if (!finalTx) {
      const createdTx = await WalletTransaction.create([{
        userId: req.user.id,
        type: 'credit',
        source: 'add_money',
        amount: amountInPaise,
        status: 'completed',
        razorpayOrderId,
        razorpayPaymentId,
        description: 'Added money to wallet via Razorpay'
      }], { session });
      finalTx = createdTx[0];
    }

    await session.commitTransaction();
    session.endSession();

    // Emit live update
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('wallet:updated', { balance: wallet.balance, newTransaction: finalTx });
    }

    res.status(200).json({ success: true, message: 'Money added successfully', balance: wallet.balance });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('[AddMoney Verify Error]', error);
    res.status(500).json({ success: false, message: 'Could not verify payment' });
  }
};



// @desc    Create a withdrawal request
// @route   POST /api/v1/wallet/withdraw
// @access  Private
exports.withdraw = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { amount, bankAccountId, pin } = req.body; // Amount in INR
    if (!amount || amount <= 0) {
      throw new Error('Valid amount required');
    }
    
    // Verify PIN locally without checking DB if possible, but user needed
    const user = await User.findById(req.user.id).session(session);
    const wallet = await Wallet.findOne({ userId: req.user.id }).select('+withdrawalPin').session(session);

    if (!wallet || !wallet.withdrawalPin) {
      throw new Error('Withdrawal PIN is not set up');
    }

    const isMatch = await bcrypt.compare(pin, wallet.withdrawalPin);
    if (!isMatch) {
      throw new Error('Incorrect Withdrawal PIN');
    }

    const bank = wallet.bankAccounts.id(bankAccountId);
    if (!bank) {
      throw new Error('Selected bank account not found');
    }

    // New Check: Ensure Bank KYC is verified
    const kyc = await mongoose.model('Kyc').findOne({ userId: req.user.id }).session(session);
    if (!kyc || !kyc.bankVerified) {
      throw new Error('Bank Account is pending admin verification. You cannot withdraw yet.');
    }

    const amountInPaise = Math.round(amount * 100);

    if (wallet.balance < amountInPaise) {
      throw new Error('Insufficient balance in wallet');
    }

    wallet.balance -= amountInPaise;
    await wallet.save({ session });

    const transaction = await WalletTransaction.create([{
      userId: req.user.id,
      type: 'debit',
      source: 'withdrawal',
      amount: amountInPaise,
      status: 'pending', // Pending admin approval
      description: `Bank Withdrawal to ${bank.bankName} (XX${bank.accountNumber.slice(-4)})`
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('wallet:updated', { balance: wallet.balance, newTransaction: transaction[0] });
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal request initiated successfully. Awaiting admin processing.',
      data: { newBalance: wallet.balance }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    const statusCode = error.message.includes('PIN') || error.message.includes('balance') || error.message.includes('Valid') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error during withdrawal' });
  }
};

// @desc    Get paginated ledger history
// @route   GET /api/v1/wallet/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { userId: req.user.id };
    if (type) query.type = type;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      WalletTransaction.countDocuments(query),
    ]);

    res.status(200).json({ 
      success: true, 
      data: { 
        transactions: transactions || [], 
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        total
      } 
    });
  } catch (error) {
    console.error('[Wallet Transactions Error]', error.message);
    res.status(500).json({ success: false, message: 'Failed to load transactions', data: { transactions: [], total: 0 } });
  }
};

// @desc    Add or update bank account
// @route   POST /api/v1/wallet/bank-account
// @access  Private
exports.addBankAccount = async (req, res, next) => {
  try {
    const { bankName, accountNumber, ifscCode, isPrimary } = req.body;
    
    if (!bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ success: false, message: 'All bank details are required' });
    }

    const encryptedAccount = encrypt(accountNumber);
    const wallet = await getOrCreateWallet(req.user.id);

    if (isPrimary) {
      wallet.bankAccounts.forEach(b => b.isPrimary = false);
    }

    wallet.bankAccounts.push({
      bankName,
      accountNumber: encryptedAccount,
      ifscCode,
      isPrimary: isPrimary || wallet.bankAccounts.length === 0
    });

    await wallet.save();

    res.status(200).json({ success: true, message: 'Bank account added successfully' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/v1/wallet/verify-pin (Kept for frontend compatibility if needed)
exports.verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, message: 'PIN is required' });

    const wallet = await Wallet.findOne({ userId: req.user.id }).select('+withdrawalPin');
    if (!wallet || !wallet.withdrawalPin) {
      return res.status(400).json({ success: false, message: 'Withdrawal PIN is not set up' });
    }

    const isMatch = await bcrypt.compare(pin, wallet.withdrawalPin);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect Withdrawal PIN' });
    }

    res.status(200).json({ success: true, message: 'PIN verified successfully' });
  } catch (error) {
    next(error);
  }
};