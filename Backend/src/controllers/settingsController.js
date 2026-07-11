const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const NotificationPreference = require('../models/NotificationPreference');

const NOTIFICATION_CATEGORIES = [
  'security', 'wallet', 'payments', 'escrow', 'messages', 'chat',
  'jobs', 'proposals', 'marketing', 'promotions', 'aiSuggestions', 'systemUpdates',
];
const NOTIFICATION_CHANNELS = ['email', 'sms', 'push', 'inApp'];

exports.updateSettings = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    const setting = await SystemSettings.findOneAndUpdate(
      { key },
      { value, description },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSettings.find({}).lean();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.getPrivacySettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('privacySettings');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user.privacySettings });
  } catch (err) {
    next(err);
  }
};

exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const { showEmail, showPhone, showEarnings, profileVisibility } = req.body;
    const update = {};
    if (showEmail !== undefined) update['privacySettings.showEmail'] = showEmail;
    if (showPhone !== undefined) update['privacySettings.showPhone'] = showPhone;
    if (showEarnings !== undefined) update['privacySettings.showEarnings'] = showEarnings;
    if (profileVisibility !== undefined) update['privacySettings.profileVisibility'] = profileVisibility;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true }).select('privacySettings');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user.privacySettings });
  } catch (err) {
    next(err);
  }
};

// GET /settings/notifications
exports.getNotificationPrefs = async (req, res, next) => {
  try {
    let prefs = await NotificationPreference.findOne({ userId: req.user.id });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId: req.user.id });
    }
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};

// PUT /settings/notifications
exports.updateNotificationPrefs = async (req, res, next) => {
  try {
    const update = {};
    for (const category of NOTIFICATION_CATEGORIES) {
      const value = req.body[category];
      if (value === undefined || value === null || typeof value !== 'object') continue;
      for (const channel of NOTIFICATION_CHANNELS) {
        if (typeof value[channel] === 'boolean') {
          update[`${category}.${channel}`] = value[channel];
        }
      }
    }

    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};
