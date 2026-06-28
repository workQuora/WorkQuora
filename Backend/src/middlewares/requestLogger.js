const crypto = require('crypto');
const morgan = require('morgan');
const logger = require('../utils/logger');

// Middleware to assign a unique Trace ID to every incoming API request
const traceRequest = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  req.traceId = traceId;
  res.setHeader('x-trace-id', traceId);
  next();
};

// Morgan request logging integration mapping to Winston logs
const morganLogger = morgan((tokens, req, res) => {
  const logMessage = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTimeMs: tokens['response-time'](req, res),
    traceId: req.traceId,
  };

  logger.info(`HTTP ${logMessage.method} ${logMessage.url} returned status ${logMessage.status}`, logMessage);
  return null; // Morgan console override bypassed (Winston handles console)
});

module.exports = { traceRequest, morganLogger };
