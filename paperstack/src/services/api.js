import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your computer's IP address instead of localhost
const API_URL = 'http://192.168.97.53:8080/api'; // Add /api to base URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  async (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url, config.data);
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const authService = {
  signup: (email, password) => api.post('/auth/signup', { email, password }),
  verifyOtp: (email, otp, password) => api.post('/auth/verify-otp', { email, otp, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export default api; 