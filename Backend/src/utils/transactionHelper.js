const mongoose = require('mongoose');

/**
 * Executes a function within a Mongoose transaction block (ACID compliance - Vol 7 & 13)
 * Gracefully falls back to sequential execution if local MongoDB doesn't run as a Replica Set.
 */
const runInTransaction = async (workFn) => {
  const session = await mongoose.startSession().catch(() => null);

  if (!session) {
    console.warn('⚠️ MongoDB Sessions not supported in this environment. Falling back to sequential queries.');
    return await workFn(null);
  }

  try {
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    // If the deployment doesn't support replica set transactions, run fallback execution
    if (error.message && (
      error.message.includes('replica set') || 
      error.message.includes('transaction') ||
      error.code === 20
    )) {
      console.warn('⚠️ Replica Set not configured. Rolling back transaction and executing sequentially without session.');
      try {
        await session.abortTransaction();
      } catch {}
      session.endSession();
      // Run sequential work function as fallback
      return await workFn(null);
    }

    // Actual query/business logic failure, trigger rollback and bubble error
    try {
      await session.abortTransaction();
    } catch {}
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { runInTransaction };
