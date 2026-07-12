const axios = require('axios');

const isPrivateIp = (ip) => {
  if (!ip) return true;
  const clean = ip.replace('::ffff:', '');
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    /^10\./.test(clean) ||
    /^192\.168\./.test(clean) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(clean)
  );
};

// Derives {country, city} from a client IP via ip-api.com's free JSON
// endpoint. Never throws — falls back to 'Unknown' on any failure (private/
// local IP, network error, rate limit) so login/session creation never
// breaks because of a geolocation lookup.
const getLocationFromIp = async (ip) => {
  const fallback = { country: 'Unknown', city: 'Unknown' };
  if (isPrivateIp(ip)) return fallback;

  try {
    const cleanIp = ip.replace('::ffff:', '');
    const { data } = await axios.get(`http://ip-api.com/json/${cleanIp}`, {
      params: { fields: 'status,country,city' },
      timeout: 3000,
    });
    if (data?.status !== 'success') return fallback;
    return { country: data.country || 'Unknown', city: data.city || 'Unknown' };
  } catch (error) {
    return fallback;
  }
};

module.exports = { getLocationFromIp };
