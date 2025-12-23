/**
 * API Configuration and Interceptors
 * Handles authentication, error handling, and request/response transformation
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

/**
 * Request Interceptor: Add JWT token to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Handle auth errors and logout
 */
api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Handle other errors
    if (error.response?.status === 403) {
      // Access forbidden
      console.error('Access forbidden:', error.response.data?.message);
    }

    return Promise.reject(error);
  }
);

export default api;
