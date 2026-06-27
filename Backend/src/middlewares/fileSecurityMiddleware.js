const crypto = require('crypto');
const FileType = require('file-type');

const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': { maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/png': { maxSize: 5 * 1024 * 1024 },
  'image/webp': { maxSize: 5 * 1024 * 1024 },
  
  // Videos
  'video/mp4': { maxSize: 50 * 1024 * 1024 }, // 50MB
  
  // Audio
  'audio/mpeg': { maxSize: 10 * 1024 * 1024 }, // 10MB
  'audio/m4a': { maxSize: 10 * 1024 * 1024 },
};

/**
 * Middleware to securely validate uploaded files using magic bytes and size limits.
 * Also computes a SHA-256 hash of the file.
 * Must run after multer.
 */
exports.secureFileValidator = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return next(); // Pass to controller to handle missing file if needed
    }

    // 1. Check Magic Bytes to prevent extension spoofing
    const fileTypeResult = await FileType.fromBuffer(file.buffer);
    if (!fileTypeResult) {
      return res.status(400).json({ success: false, message: 'Invalid or unknown file type detected.' });
    }

    const detectedMime = fileTypeResult.mime;
    
    // 2. Validate against allowed types
    if (!ALLOWED_MIME_TYPES[detectedMime]) {
      return res.status(400).json({ 
        success: false, 
        message: `File type ${detectedMime} is not allowed.` 
      });
    }

    // 3. Enforce strict size limit per type
    const maxSize = ALLOWED_MIME_TYPES[detectedMime].maxSize;
    if (file.size > maxSize) {
      return res.status(400).json({ 
        success: false, 
        message: `File exceeds the maximum allowed size for ${detectedMime} (${maxSize / (1024 * 1024)}MB).` 
      });
    }

    // Override req.file.mimetype with the guaranteed detected mime
    file.mimetype = detectedMime;

    // 4. Compute SHA-256 Hash for deduplication/tamper checks
    const hashSum = crypto.createHash('sha256');
    hashSum.update(file.buffer);
    file.hash = hashSum.digest('hex');

    next();
  } catch (error) {
    console.error('[FileSecurityMiddleware Error]', error);
    res.status(500).json({ success: false, message: 'Server error during file validation.' });
  }
};
