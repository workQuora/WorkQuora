const Transaction = require('../../../models/Transaction');
const Wallet = require('../../../models/Wallet');
const Earnings = require('../../../models/Earnings');
const User = require('../../../models/User');
const { createAuditLog } = require('../utils/adminAuditLogger');

// GET /api/admin/payments
exports.getAllTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true, data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
};

// GET /api/admin/payments/:transactionId
exports.getTransactionDetail = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.transactionId).lean();
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    // Enrich with user info
    let userInfo = null;
    const uid = txn.userId || txn.from;
    if (uid) userInfo = await User.findById(uid).select('name email username role').lean();

    res.status(200).json({ success: true, data: { ...txn, userInfo } });
  } catch (error) { next(error); }
};

// POST /api/admin/payments/:transactionId/refund
exports.processRefund = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.transactionId);
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const oldData = { status: txn.status };
    txn.status = 'refunded';
    await txn.save();

    // Credit amount back to wallet if exists
    const uid = txn.userId || txn.from;
    if (uid && txn.amount) {
      await Wallet.findOneAndUpdate(
        { userId: uid },
        { $inc: { balance: Math.abs(txn.amount) } },
        { upsert: true }
      );
    }

    await createAuditLog({
      admin: req.admin, actionType: 'PAYMENT_REFUND', targetType: 'PAYMENT',
      targetId: txn._id, description: `Refunded ₹${txn.amount} for transaction ${txn._id}. Reason: ${req.body.reason || 'Admin action'}`,
      oldData, newData: { status: 'refunded' }, req, severity: 'HIGH',
    });

    res.status(200).json({ success: true, message: 'Refund processed.', data: txn });
  } catch (error) { next(error); }
};

// GET /api/admin/payments/wallets
exports.getAllWallets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [wallets, total] = await Promise.all([
      Wallet.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Wallet.countDocuments(),
    ]);

    // Enrich with user names
    const enriched = await Promise.all(wallets.map(async (w) => {
      const user = await User.findById(w.userId).select('name email username role').lean();
      return { ...w, userInfo: user };
    }));

    res.status(200).json({
      success: true, data: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
};

// GET /api/admin/payments/earnings
exports.getEarningsOverview = async (req, res, next) => {
  try {
    const agg = await Earnings.aggregate([
      { $group: { _id: null, totalEarned: { $sum: '$allTimeIncome' }, totalCompleted: { $sum: '$completedJobs' }, count: { $sum: 1 } } },
    ]);
    const result = agg[0] || { totalEarned: 0, totalCompleted: 0, count: 0 };

    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

const WalletTransaction = require('../../../models/WalletTransaction');
const JobPayment = require('../../../models/JobPayment');
const { decrypt } = require('../../../utils/encryption');

// @desc    Get all pending withdrawals
// @route   GET /api/admin/payments/withdrawals
// @access  Private (Admin)
exports.getPendingWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await WalletTransaction.find({
      type: 'debit',
      source: 'withdrawal',
      status: 'pending'
    }).populate('userId', 'name email').lean();

    // Attach decrypted bank account details for admin view
    const populatedWithdrawals = await Promise.all(withdrawals.map(async (tx) => {
      const wallet = await Wallet.findOne({ userId: tx.userId }).lean();
      
      const bankAccounts = wallet ? wallet.bankAccounts.map(b => ({
        bankName: b.bankName,
        accountNumber: b.accountNumber ? decrypt(b.accountNumber) : 'Unknown',
        ifscCode: b.ifscCode
      })) : [];

      return {
        ...tx,
        amountFormatted: tx.amount / 100,
        bankAccounts 
      };
    }));

    res.status(200).json({ success: true, data: populatedWithdrawals });
  } catch (error) {
    next(error);
  }
};

// @desc    Process a pending withdrawal
// @route   PATCH /api/admin/payments/withdrawals/:id/process
// @access  Private (Admin)
exports.processWithdrawal = async (req, res, next) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { status, adminNote } = req.body; // 'completed' or 'failed'
    if (!['completed', 'failed'].includes(status)) {
      throw new Error('Invalid status update');
    }

    const transaction = await WalletTransaction.findById(req.params.id).session(session);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'pending') throw new Error('Transaction is not pending');

    transaction.status = status;
    if (adminNote) transaction.description += ` | Admin Note: ${adminNote}`;
    
    await transaction.save({ session });

    let wallet = await Wallet.findOne({ userId: transaction.userId }).session(session);

    if (status === 'failed') {
      // Refund the wallet
      wallet.balance += transaction.amount;
      await wallet.save({ session });

      // Create refund ledger entry
      await WalletTransaction.create([{
        userId: transaction.userId,
        type: 'credit',
        source: 'refund',
        amount: transaction.amount,
        status: 'completed',
        description: `Refund for failed withdrawal. Note: ${adminNote || 'None'}`
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Emit live update
    const io = req.app.get('io');
    if (io) {
      io.to(transaction.userId.toString()).emit('wallet:updated', { balance: wallet.balance });
    }

    res.status(200).json({ success: true, message: `Withdrawal marked as ${status}` });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};
