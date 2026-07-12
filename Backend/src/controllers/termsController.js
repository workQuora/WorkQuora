const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const getTermsConfig = () => {
  const filePath = path.join(__dirname, '../config/terms.json');
  if (!fs.existsSync(filePath)) {
    throw new Error('Terms configuration file is missing');
  }
  const terms = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!terms || typeof terms.name !== 'string' || !terms.name.trim() ||
      typeof terms.version !== 'string' || !terms.version.trim() ||
      !Array.isArray(terms.content)) {
    throw new Error('Invalid terms configuration format');
  }
  return terms;
};

exports.getCurrentTerms = async (req, res, next) => {
  try {
    const terms = getTermsConfig();
    return res.status(200).json({
      success: true,
      terms
    });
  } catch (error) {
    console.error('❌ Terms controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to validate current platform terms. Please try again later.'
    });
  }
};

exports.acceptTerms = async (req, res, next) => {
  try {
    const terms = getTermsConfig();
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.termsAcceptedVersion = terms.version;
    user.termsAcceptedAt = new Date();
    if (!user.privacyAcceptedAt) {
      user.privacyAcceptedAt = new Date();
    }
    await user.save();

    const roleSelected = !!(user.role && ['CLIENT', 'FREELANCER'].includes(user.role.toUpperCase()));
    const currentTermsAccepted = user.termsAcceptedVersion === terms.version && !!user.termsAcceptedAt;
    const onboardingComplete = roleSelected && currentTermsAccepted;

    return res.status(200).json({
      success: true,
      termsAcceptedVersion: user.termsAcceptedVersion,
      termsAcceptedAt: user.termsAcceptedAt,
      onboardingComplete
    });
  } catch (error) {
    console.error('❌ Terms acceptance error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to validate current platform terms. Please try again later.'
    });
  }
};
