const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud', 
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret' 
});

const uploadToCloudinary = async (file, folder = 'workquora') => {
  try {
    // If we don't have real cloudinary keys, just return a mock URL so dev can continue
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return `https://res.cloudinary.com/demo/image/upload/v1234567890/${folder}/mock_image.jpg`;
    }

    const result = await cloudinary.uploader.upload(file.path, { folder });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Fallback to mock url in case of error in dev
    return `https://res.cloudinary.com/demo/image/upload/v1234567890/${folder}/fallback_image.jpg`;
  }
};

module.exports = { uploadToCloudinary };
