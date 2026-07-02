const Ledger = require('../models/Ledger');
const Earnings = require('../models/Earnings');
const crypto = require('crypto');

class WalletLedgerService {
  /**
   * Post double entry transaction ledger log
   * Enforces strict ledger-first balances (Vol 10)
   */
  async postEntry({ userId, transactionId, debit = 0, credit = 0, reference, description, currency = 'INR', session = null }) {
    const txId = transactionId || crypto.randomUUID();
    const amount = Number(credit) - Number(debit);

    // 1. Update Earnings atomically using $inc
    const updatedEarnings = await Earnings.findOneAndUpdate(
      { userId },
      { $inc: { walletBalance: amount } },
      { new: true, session }
    );

    if (!updatedEarnings) {
      throw new Error(`Earnings wallet not found for user: ${userId}`);
    }

    const runningBalance = updatedEarnings.walletBalance;

    // 2. Create Ledger entry with the atomic running balance
    const ledgerEntryArr = await Ledger.create(
      [
        {
          transactionId: txId,
          walletId: userId,
          debit: Number(debit),
          credit: Number(credit),
          runningBalance: Number(runningBalance),
          currency,
          reference,
          description,
        },
      ],
      { session }
    );

    return { ledgerEntry: ledgerEntryArr[0], earnings: updatedEarnings };
  }

  /**
   * Verify integrity of a user's wallet ledger
   */
  async verifyIntegrity(userId) {
    const aggregateResult = await Ledger.aggregate([
      { $match: { walletId: userId } },
      {
        $group: {
          _id: null,
          totalCredits: { $sum: '$credit' },
          totalDebits: { $sum: '$debit' },
        },
      },
    ]);

    const earnings = await Earnings.findOne({ userId }).lean();
    const docBalance = earnings?.walletBalance || 0;

    let verifiedBalance = 0;
    if (aggregateResult && aggregateResult.length > 0) {
      verifiedBalance = aggregateResult[0].totalCredits - aggregateResult[0].totalDebits;
    }

    return {
      userId,
      documentBalance: docBalance,
      verifiedLedgerBalance: verifiedBalance,
      isConsistent: Math.abs(docBalance - verifiedBalance) < 0.001,
    };
  }
}

module.exports = new WalletLedgerService();
