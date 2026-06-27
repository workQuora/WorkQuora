const cloudinary = require('../config/cloudinary');

/**
 * Uploads a file buffer to Cloudinary using upload_stream.
 * @param {Buffer} fileBuffer - The file buffer in memory
 * @param {string} folder - Destination folder in Cloudinary
 * @param {object} options - Extra options for Cloudinary (e.g. type, transformation)
 * @returns {Promise<{ url: string, secureUrl: string, publicId: string }>}
 */
exports.uploadFile = (fileBuffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder,
      resource_type: 'auto',
    };

    // If it's a KYC document or marked authenticated
    if (options.type === 'authenticated') {
      defaultOptions.type = 'authenticated';
    }

    // Strip EXIF data if requested (important for KYC photos and selfies)
    if (options.stripExif) {
      defaultOptions.transformation = { flags: 'strip_profile' };
    }

    const uploadOptions = { ...defaultOptions, ...options };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          return reject(error);
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Generates a short-lived signed URL for an authenticated/private asset.
 * @param {string} publicId - The Cloudinary public_id
 * @param {number} expiresInSeconds - Expiration time in seconds (e.g., 300 for 5 mins)
 * @returns {string} - Signed URL
 */
exports.getSignedUrl = (publicId, expiresInSeconds = 300) => {
  // If it's a mock local development URL, just return it as is
  if (publicId.startsWith('http')) return publicId;

  // Cloudinary sign_url requires the full resource URL to sign it (not just publicId in v2 usually,
  // but we can use cloudinary.utils.private_download_url)
  const url = cloudinary.utils.private_download_url(
    publicId,
    'png', // fallback format, Cloudinary usually ignores this for authenticated original fetch if format isn't strictly requested, but providing one is safe. Let's use empty string or original extension.
    {
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      resource_type: 'image' // Assume image for KYC. We can make it dynamic if needed.
    }
  );
  return url;
};

/**
 * Deletes a file from Cloudinary.
 * @param {string} publicId - The public ID of the asset
 * @param {string} resourceType - Resource type (image, video, raw). Default: 'image'
 * @returns {Promise<any>}
 */
exports.deleteFile = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId || publicId.startsWith('http')) return; // Ignore mock URLs
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error(`[Cloudinary Delete Error] Failed to delete ${publicId}:`, error);
    throw error;
  }
};
