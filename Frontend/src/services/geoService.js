import api from './api';

export const geoService = {
  updateLocation: (lat, lng) => api.put('/geo/update-location', { latitude: lat, longitude: lng }),
  getNearbyJobs: (lat, lng, radiusKm, category = '') =>
    api.get('/geo/nearby-jobs', { params: { lat, lng, radius: radiusKm, ...(category && { category }) } }),
  getNearbyFreelancers: (lat, lng, radiusKm) =>
    api.get('/geo/nearby-freelancers', { params: { lat, lng, radius: radiusKm } }),
  setWorkingRadius: (radiusKm) => api.put('/geo/set-radius', { radius: radiusKm }),
};