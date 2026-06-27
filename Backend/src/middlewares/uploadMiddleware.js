const multer = require('multer');

// Memory storage use karenge taaki server par faltu files save na hon
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Set broad limit (50MB), strict limits handled in fileSecurityMiddleware
});

module.exports = upload;