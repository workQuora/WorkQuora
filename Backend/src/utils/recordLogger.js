const Record = require('../models/Record');
const { parseUserAgent } = require('./uaParser');

// Writes to the admin-only "records" collection (Task: account history/audit
// evidence). Never surfaced to the user it's about — only read by admin
// routes. Best-effort: a logging failure must never break the user-facing
// action that triggered it.
const createRecord = async (req, { userId, action, oldValue, newValue }) => {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || 'Unknown';
    const ua = parseUserAgent(req?.headers?.['user-agent'] || '');
    const device = `${ua.browser} on ${ua.operatingSystem}`;

    await Record.create({
      userId,
      action,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      ipAddress: ip,
      device,
    });
  } catch (error) {
    console.error('Failed to write account history record:', error.message);
  }
};

module.exports = { createRecord };
