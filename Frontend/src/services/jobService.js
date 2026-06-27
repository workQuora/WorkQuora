import api from './api';
import { getApiData } from '../lib/apiResponse';

export const jobService = {
  getJobs: (params) => api.get('/jobs', { params }).then(getApiData),
  searchJobs: (params) => api.get('/jobs/search', { params }).then(getApiData),
  getJobById: (id) => api.get(`/jobs/${id}`).then(getApiData),
  createJob: (jobData) => api.post('/jobs', jobData).then(getApiData),
  getMyJobs: () => api.get('/jobs/my-jobs').then(getApiData),
};
