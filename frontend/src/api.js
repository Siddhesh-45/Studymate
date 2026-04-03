import axios from 'axios';

// Base axios instance — all API calls go through this
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Before every request, automatically attach the JWT token if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// If any response comes back 401 (token expired / invalid), log user out
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
