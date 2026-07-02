const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const featureFlags = require('../config/featureFlags');

class StorageProvider {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'local';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  }

  /**
   * Universal upload handler
   */
  async upload(fileBuffer, folder, options = {}) {
    if (!featureFlags.ENABLE_STORAGE) {
      throw new Error('Storage module is disabled via feature flags.');
    }

    // 1. File size checks
    if (fileBuffer.length > this.maxFileSize) {
      throw new Error('File exceeds maximum size limits (10MB).');
    }

    // 2. MIME checks
    if (options.mimeType && !this.allowedMimeTypes.includes(options.mimeType)) {
      throw new Error('MIME type not allowed. Please upload PNG, JPG, WEBP, or PDF.');
    }

    // Process options hooks
    if (options.compress) {
      console.log('⚡ StorageProvider: Running image compression hook (stub)');
    }
    if (options.thumbnail) {
      console.log('⚡ StorageProvider: Running thumbnail generation hook (stub)');
    }

    // Route to selected driver provider
    switch (this.provider) {
      case 'cloudinary':
        return this._uploadToCloudinary(fileBuffer, folder, options);
      case 's3':
        return this._uploadToS3(fileBuffer, folder, options);
      case 'azure':
        return this._uploadToAzure(fileBuffer, folder, options);
      case 'local':
      default:
        return this._uploadToLocal(fileBuffer, folder, options);
    }
  }

  /**
   * Universal URL signer
   */
  getSignedUrl(publicId, expiresInSeconds = 300) {
    if (publicId.startsWith('http')) return publicId;

    switch (this.provider) {
      case 'cloudinary':
        const cloudinary = require('../config/cloudinary');
        return cloudinary.utils.private_download_url(publicId, 'png', {
          type: 'authenticated',
          expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
        });
      case 's3':
        return `https://s3.amazonaws.com/workquora-bucket/${publicId}?signed=true&expires=${expiresInSeconds}`;
      case 'azure':
        return `https://workquora.blob.core.windows.net/uploads/${publicId}?sasToken=mockSignature`;
      case 'local':
      default:
        return `http://localhost:3000/uploads/${publicId}`;
    }
  }

  /**
   * Universal delete handler
   */
  async delete(publicId, resourceType = 'image') {
    if (publicId.startsWith('http')) return;

    switch (this.provider) {
      case 'cloudinary':
        const cloudinary = require('../config/cloudinary');
        return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      case 's3':
        console.log(`🗑️ AWS S3: Deleted asset ${publicId}`);
        return { result: 'ok' };
      case 'azure':
        console.log(`🗑️ Azure Blob: Deleted asset ${publicId}`);
        return { result: 'ok' };
      case 'local':
      default:
        return this._deleteLocal(publicId);
    }
  }

  // ── Private Providers Drivers ──────────────────────────────────────────────

  async _uploadToCloudinary(fileBuffer, folder, options) {
    const cloudinary = require('../config/cloudinary');
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: 'auto',
      };
      if (options.type === 'authenticated') {
        uploadOptions.type = 'authenticated';
      }
      if (options.stripExif) {
        uploadOptions.transformation = { flags: 'strip_profile' };
      }

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      });
      stream.end(fileBuffer);
    });
  }

  async _uploadToLocal(fileBuffer, folder, options) {
    const safeComponents = folder
      .split(/[/\\]/)
      .map(comp => comp.replace(/[^a-zA-Z0-9\-_]/g, ''))
      .filter(comp => comp.length > 0 && comp !== '.' && comp !== '..');

    const safeFolder = safeComponents.join(path.sep);
    const baseDir = path.resolve(__dirname, '../../public/uploads');
    const uploadDir = path.resolve(baseDir, safeFolder);

    if (!uploadDir.startsWith(baseDir + path.sep) && uploadDir !== baseDir) {
      throw new Error('Invalid upload path — path traversal detected');
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${crypto.randomBytes(16).toString('hex')}${options.extension || '.png'}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, fileBuffer);

    const relativePath = `${safeComponents.join('/')}/${filename}`;
    return {
      url: `http://localhost:3000/uploads/${relativePath}`,
      secureUrl: `http://localhost:3000/uploads/${relativePath}`,
      publicId: relativePath,
    };
  }

  async _deleteLocal(publicId) {
    const safeComponents = publicId
      .split(/[/\\]/)
      .map(comp => comp.replace(/[^a-zA-Z0-9\-_\.]/g, ''))
      .filter(comp => comp.length > 0 && comp !== '.' && comp !== '..');

    const safePublicId = safeComponents.join(path.sep);
    const baseDir = path.resolve(__dirname, '../../public/uploads');
    const filePath = path.resolve(baseDir, safePublicId);

    if (!filePath.startsWith(baseDir + path.sep)) {
      throw new Error('Invalid delete path — path traversal detected');
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { result: 'ok' };
  }

  async _uploadToS3(fileBuffer, folder, options) {
    // S3 Mock Uploader
    const filename = `${folder}/${crypto.randomBytes(16).toString('hex')}.png`;
    console.log(`☁️ AWS S3: Uploaded ${filename} (${fileBuffer.length} bytes)`);
    return {
      url: `https://s3.amazonaws.com/workquora-bucket/${filename}`,
      secureUrl: `https://s3.amazonaws.com/workquora-bucket/${filename}`,
      publicId: filename,
    };
  }

  async _uploadToAzure(fileBuffer, folder, options) {
    // Azure Blob Mock Uploader
    const filename = `${folder}/${crypto.randomBytes(16).toString('hex')}.png`;
    console.log(`☁️ Azure Blob: Uploaded ${filename} (${fileBuffer.length} bytes)`);
    return {
      url: `https://workquora.blob.core.windows.net/uploads/${filename}`,
      secureUrl: `https://workquora.blob.core.windows.net/uploads/${filename}`,
      publicId: filename,
    };
  }
}

module.exports = new StorageProvider();
