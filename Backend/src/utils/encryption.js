const crypto = require('crypto');

// The algorithm to use
const algorithm = 'aes-256-cbc';

// Secret key should be exactly 32 bytes (256 bits)
// If ENCRYPTION_KEY is missing, we use a deterministic dummy key for local testing
const secretKey = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';

// Ensure key is buffer of exactly 32 bytes
const key = Buffer.from(secretKey, 'utf8').slice(0, 32);

/**
 * Encrypts a plain text string using AES-256-CBC
 * @param {string} text - The plain text string to encrypt
 * @returns {string} - The encrypted string in format: iv:encryptedText
 */
exports.encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts an encrypted string using AES-256-CBC
 * @param {string} encryptedText - The encrypted string in format: iv:encryptedText
 * @returns {string} - The decrypted plain text string
 */
exports.decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  const parts = encryptedText.split(':');
  if (parts.length !== 2) return encryptedText; // Fallback for unencrypted legacy data
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
