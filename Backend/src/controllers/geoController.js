const Job  = require('../models/Job');
const User = require('../models/User');

const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// GET /geo/nearby-jobs
exports.getNearbyJobs = async (req, res, next) => {
  try {
    const { lat, lng, radius = 25, category, keyword } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });

    const query = {
      status: 'open',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) * 1000,
        },
      },
    };
    if (category && category !== 'all' && category !== 'All') {
      query.category = { $regex: category, $options: 'i' };
    }
    if (keyword)  query.$or = [
      { title:       { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
    ];

    const jobs = await Job.find(query).limit(50);
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        try {
          const clientInfo = await User.findById(job.client)
            .select('name username profilePic avatar email')
            .lean();
          if (clientInfo) {
            clientInfo.id = clientInfo._id;
            clientInfo.profilePic = clientInfo.profilePic || clientInfo.avatar;
          }
          return { ...job.toObject(), clientInfo };
        } catch {
          return job.toObject();
        }
      })
    );

    const withDist = enrichedJobs.map((j) => ({
      ...j,
      distance: Math.round(haversine(Number(lat), Number(lng), j.location.coordinates[1], j.location.coordinates[0]) * 10) / 10,
    }));

    res.status(200).json({ success: true, count: withDist.length, jobs: withDist });
  } catch (error) { next(error); }
};

// GET /geo/nearby-freelancers
exports.getNearbyFreelancers = async (req, res, next) => {
  try {
    const { lat, lng, radius = 25, category, keyword } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });

    const query = {
      role: 'FREELANCER',
      isAvailable: true
    };

    if (category && category !== 'all' && category !== 'All') {
      query.skills = { $in: [new RegExp(category, 'i')] };
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { username: { $regex: keyword, $options: 'i' } },
        { title: { $regex: keyword, $options: 'i' } },
        { bio: { $regex: keyword, $options: 'i' } },
        { skills: { $regex: keyword, $options: 'i' } },
      ];
    }

    const freelancers = await User.find(query).select('-password');
    const withDist = freelancers.map((f) => {
      const obj = f.toObject();
      let distance = 0;
      if (f.location && f.location.coordinates && f.location.coordinates.length === 2) {
        const fLng = f.location.coordinates[0];
        const fLat = f.location.coordinates[1];
        if (fLng !== 0 || fLat !== 0) {
          distance = Math.round(haversine(Number(lat), Number(lng), fLat, fLng) * 10) / 10;
        }
      }
      return {
        ...obj,
        isVerified: !!(obj.isKycVerified),  // KYC badge = Aadhaar + PAN only
        distance,
      };
    });

    // Sort by distance (put unspecified locations [0,0] at the bottom)
    withDist.sort((a, b) => {
      const distA = a.location?.coordinates?.[0] === 0 && a.location?.coordinates?.[1] === 0 ? 999999 : a.distance;
      const distB = b.location?.coordinates?.[0] === 0 && b.location?.coordinates?.[1] === 0 ? 999999 : b.distance;
      return distA - distB;
    });

    res.status(200).json({
      success: true,
      count: withDist.length,
      freelancers: withDist,
      data: withDist,
    });
  } catch (error) { next(error); }
};

// PUT /geo/update-location
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, address, city } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'latitude and longitude required' });

    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email },
      { 
        location: { 
          type: 'Point', 
          coordinates: [Number(longitude), Number(latitude)],
          address: address || '',
          city: city || ''
        } 
      },
      { new: true, upsert: true }
    ).select('-password');

    res.status(200).json({ success: true, message: 'Location updated', user: updatedUser });
  } catch (error) { next(error); }
};

// PUT /geo/set-radius
exports.setRadius = async (req, res, next) => {
  try {
    const { radius } = req.body;
    if (!radius) return res.status(400).json({ success: false, message: 'radius required' });

    await User.findOneAndUpdate({ email: req.user.email }, { serviceRadius: Number(radius) }, { upsert: true });
    res.status(200).json({ success: true, message: `Radius set to ${radius} km` });
  } catch (error) { next(error); }
};

// Fallback city-level database — used only when Nominatim fails or returns
// nothing. Not exhaustive; covers state/UT capitals plus major metro and
// tier-2 cities. No such list previously existed in this codebase.
const INDIAN_CITIES = [
  { name: 'Agartala, Tripura', lat: 23.8315, lng: 91.2868 },
  { name: 'Agra, Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Aizawl, Mizoram', lat: 23.7271, lng: 92.7176 },
  { name: 'Ajmer, Rajasthan', lat: 26.4499, lng: 74.6399 },
  { name: 'Aligarh, Uttar Pradesh', lat: 27.8974, lng: 78.0880 },
  { name: 'Amritsar, Punjab', lat: 31.6340, lng: 74.8723 },
  { name: 'Aurangabad, Maharashtra', lat: 19.8762, lng: 75.3433 },
  { name: 'Bareilly, Uttar Pradesh', lat: 28.3670, lng: 79.4304 },
  { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Bhavnagar, Gujarat', lat: 21.7645, lng: 72.1519 },
  { name: 'Bhopal, Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Bhubaneswar, Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Bikaner, Rajasthan', lat: 28.0229, lng: 73.3119 },
  { name: 'Bilaspur, Chhattisgarh', lat: 22.0797, lng: 82.1391 },
  { name: 'Chandigarh, Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Cuttack, Odisha', lat: 20.4625, lng: 85.8828 },
  { name: 'Dehradun, Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Dhanbad, Jharkhand', lat: 23.7957, lng: 86.4304 },
  { name: 'Durgapur, West Bengal', lat: 23.5204, lng: 87.3119 },
  { name: 'Faridabad, Haryana', lat: 28.4089, lng: 77.3178 },
  { name: 'Gandhinagar, Gujarat', lat: 23.2156, lng: 72.6369 },
  { name: 'Gangtok, Sikkim', lat: 27.3389, lng: 88.6065 },
  { name: 'Ghaziabad, Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  { name: 'Gorakhpur, Uttar Pradesh', lat: 26.7606, lng: 83.3732 },
  { name: 'Guntur, Andhra Pradesh', lat: 16.3067, lng: 80.4365 },
  { name: 'Gurugram, Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Guwahati, Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Gwalior, Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  { name: 'Hubli, Karnataka', lat: 15.3647, lng: 75.1240 },
  { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Imphal, Manipur', lat: 24.8170, lng: 93.9368 },
  { name: 'Indore, Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Itanagar, Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
  { name: 'Jabalpur, Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Jalandhar, Punjab', lat: 31.3260, lng: 75.5762 },
  { name: 'Jalgaon, Maharashtra', lat: 21.0077, lng: 75.5626 },
  { name: 'Jammu, Jammu and Kashmir', lat: 32.7266, lng: 74.8570 },
  { name: 'Jamnagar, Gujarat', lat: 22.4707, lng: 70.0577 },
  { name: 'Jamshedpur, Jharkhand', lat: 22.8046, lng: 86.2029 },
  { name: 'Jhansi, Uttar Pradesh', lat: 25.4484, lng: 78.5685 },
  { name: 'Jodhpur, Rajasthan', lat: 26.2389, lng: 73.0243 },
  { name: 'Kanpur, Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { name: 'Kochi, Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Kohima, Nagaland', lat: 25.6751, lng: 94.1086 },
  { name: 'Kolhapur, Maharashtra', lat: 16.7050, lng: 74.2433 },
  { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Kota, Rajasthan', lat: 25.2138, lng: 75.8648 },
  { name: 'Kozhikode, Kerala', lat: 11.2588, lng: 75.7804 },
  { name: 'Lucknow, Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Ludhiana, Punjab', lat: 30.9010, lng: 75.8573 },
  { name: 'Madurai, Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { name: 'Mangalore, Karnataka', lat: 12.9141, lng: 74.8560 },
  { name: 'Meerut, Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  { name: 'Moradabad, Uttar Pradesh', lat: 28.8386, lng: 78.7733 },
  { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Muzaffarpur, Bihar', lat: 26.1225, lng: 85.3906 },
  { name: 'Mysuru, Karnataka', lat: 12.2958, lng: 76.6394 },
  { name: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Nashik, Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Navi Mumbai, Maharashtra', lat: 19.0330, lng: 73.0297 },
  { name: 'Nellore, Andhra Pradesh', lat: 14.4426, lng: 79.9865 },
  { name: 'Noida, Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { name: 'Panaji, Goa', lat: 15.4909, lng: 73.8278 },
  { name: 'Patna, Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Pondicherry, Puducherry', lat: 11.9416, lng: 79.8083 },
  { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Raipur, Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Rajahmundry, Andhra Pradesh', lat: 17.0005, lng: 81.8040 },
  { name: 'Rajkot, Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Ranchi, Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Rourkela, Odisha', lat: 22.2604, lng: 84.8536 },
  { name: 'Salem, Tamil Nadu', lat: 11.6643, lng: 78.1460 },
  { name: 'Sangli, Maharashtra', lat: 16.8524, lng: 74.5815 },
  { name: 'Shillong, Meghalaya', lat: 25.5788, lng: 91.8933 },
  { name: 'Shimla, Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { name: 'Siliguri, West Bengal', lat: 26.7271, lng: 88.3953 },
  { name: 'Solapur, Maharashtra', lat: 17.6599, lng: 75.9064 },
  { name: 'Srinagar, Jammu and Kashmir', lat: 34.0837, lng: 74.7973 },
  { name: 'Surat, Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Thane, Maharashtra', lat: 19.2183, lng: 72.9781 },
  { name: 'Thiruvananthapuram, Kerala', lat: 8.5241, lng: 76.9366 },
  { name: 'Tiruchirappalli, Tamil Nadu', lat: 10.7905, lng: 78.7047 },
  { name: 'Udaipur, Rajasthan', lat: 24.5854, lng: 73.7125 },
  { name: 'Ujjain, Madhya Pradesh', lat: 23.1765, lng: 75.7885 },
  { name: 'Vadodara, Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Varanasi, Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { name: 'Vellore, Tamil Nadu', lat: 12.9165, lng: 79.1325 },
  { name: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { name: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Warangal, Telangana', lat: 17.9689, lng: 79.5941 },
];

// GET /geo/search — hybrid: Nominatim first (handles full/partial addresses,
// areas, landmarks), falling back to a local city-level list when Nominatim
// errors out or returns nothing (e.g. a partial prefix it can't fuzzy-match).
exports.searchLocation = async (req, res, next) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: [] });
  }

  const query = q.trim();

  try {
    const axios = require('axios');
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query + (query.toLowerCase().includes('india') ? '' : ', India'),
        format: 'json',
        limit: 8,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'WorkQuora/1.0 (contact@workquora.com)',
        'Accept-Language': 'en',
      },
      timeout: 15000,
    });

    if (response.data && response.data.length > 0) {
      const results = response.data.map((item) => {
        const addr = item.address || {};
        const parts = [
          addr.neighbourhood || addr.suburb || addr.hamlet,
          addr.city || addr.town || addr.village || addr.county,
          addr.state,
        ].filter(Boolean);

        const name = parts.length > 0
          ? parts.join(', ')
          : item.display_name.split(',').slice(0, 3).join(',').trim();

        return {
          name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      });

      const seen = new Set();
      const unique = results.filter((r) => {
        if (seen.has(r.name)) return false;
        seen.add(r.name);
        return true;
      });

      return res.json({ success: true, data: unique, source: 'nominatim' });
    }
  } catch (error) {
    console.warn('Nominatim failed, using local fallback:', error.message);
  }

  const lowerQuery = query.toLowerCase();
  const results = INDIAN_CITIES.filter((city) => city.name.toLowerCase().includes(lowerQuery));

  results.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
    const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });

  res.json({ success: true, data: results.slice(0, 8), source: 'local' });
};