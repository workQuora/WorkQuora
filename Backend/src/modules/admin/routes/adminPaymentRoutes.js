const express = require('express');
const router = express.Router();
const {
  getAllTransactions, getTransactionDetail, processRefund, getAllWallets, getEarningsOverview,
  getPendingWithdrawals, processWithdrawal
} = require('../controllers/adminPaymentController');
const { protectAdmin, requirePermission } = require('../middleware/adminAuthMiddleware');

router.use(protectAdmin);

router.get('/',                    requirePermission('view_payments'), getAllTransactions);
router.get('/wallets',             requirePermission('view_payments'), getAllWallets);
router.get('/earnings',            requirePermission('view_payments'), getEarningsOverview);

// Withdrawal endpoints
router.get('/withdrawals',         requirePermission('view_payments'), getPendingWithdrawals);
router.patch('/withdrawals/:id/process', requirePermission('process_refund'), processWithdrawal);

router.get('/:transactionId',      requirePermission('view_payments'), getTransactionDetail);
router.post('/:transactionId/refund', requirePermission('process_refund'), processRefund);

module.exports = router;
