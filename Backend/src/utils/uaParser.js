const { UAParser } = require('ua-parser-js');

const parseUserAgent = (uaString = '') => {
  const result = new UAParser(uaString).getResult();

  const browser = result.browser.name || 'Unknown';
  const operatingSystem = result.os.name || 'Unknown';
  const deviceName = result.device.type === 'mobile'
    ? 'Mobile'
    : result.device.type === 'tablet'
      ? 'Tablet'
      : 'Desktop';

  return { browser, operatingSystem, deviceName };
};

module.exports = { parseUserAgent };
