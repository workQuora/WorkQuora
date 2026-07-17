const express = require('express');
const router = express.Router();
const { getBalance, withdraw, getTransactions, verifyPin, createAddMoneyOrder, verifyAddMoneyPayment, addBankAccount , setWithdrawalPin, deleteBankAccount} = require('../controllers/walletController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { requireKyc } = require('../middlewares/requireKyc');

router.use(protect);
router.get('/balance', getBalance);
router.post('/add-money/create-order', createAddMoneyOrder);
router.post('/add-money/verify', verifyAddMoneyPayment);
// Phase A: wallet withdrawal is freelancer-only — clients only fund escrow,
// they never withdraw. KYC stays mandatory for the freelancer who does.
router.post('/withdraw', authorize('freelancer'), requireKyc, withdraw);
router.get('/transactions', getTransactions);
router.post('/bank-account', addBankAccount);
router.delete('/bank-account/:id', deleteBankAccount);
router.post('/set-pin', setWithdrawalPin);
router.post('/verify-pin', verifyPin);

module.exports = router;