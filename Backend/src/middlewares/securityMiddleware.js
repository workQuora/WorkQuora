/**
 * Security middleware to prevent NoSQL query injections and sanitize input parameter types.
 */

const sanitizeObj = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        // Strip out NoSQL Injection keys
        delete obj[key];
      } else if (obj[key] instanceof Object) {
        sanitizeObj(obj[key]);
      }
    }
  }
};

exports.mongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);
  next();
};

/**
 * Enforce parameter type validation to prevent unhandled type errors.
 * Ensures critical fields like email, username, password, OTP, and token
 * are strictly strings and not arrays/objects.
 */
exports.enforceStringParams = (fields = []) => {
  return (req, res, next) => {
    const payload = req.body || {};
    for (const field of fields) {
      if (payload[field] !== undefined && payload[field] !== null) {
        if (typeof payload[field] !== 'string') {
          return res.status(400).json({
            success: false,
            message: `Invalid input: '${field}' must be a plain text string.`
          });
        }
      }
    }
    next();
  };
};
