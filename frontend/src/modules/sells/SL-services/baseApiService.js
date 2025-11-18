import { getApiUrl } from '../../../config/env';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('salesToken');
};

// Helper function to set auth token
const setAuthToken = (token) => {
  localStorage.setItem('salesToken', token);
};

// Helper function to remove auth token
const removeAuthToken = () => {
  localStorage.removeItem('salesToken');
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Base API request helper
export const apiRequest = async (url, options = {}) => {
  try {
    const primaryUrl = getApiUrl(url);
    const response = await fetch(primaryUrl, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      },
      credentials: 'include' // Include cookies for CORS
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    // Fallback: if direct host failed (e.g., backend not running on 5000), try same-origin /api path
    try {
      if (error && (error.name === 'TypeError' || String(error).includes('Failed to fetch'))) {
        const sameOriginUrl = `/api${url.startsWith('/') ? url : `/${url}`}`;
        const response = await fetch(sameOriginUrl, {
          ...options,
          headers: {
            ...getAuthHeaders(),
            ...options.headers
          },
          credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Something went wrong');
        }
        return data;
      }
    } catch (fallbackError) {
      console.error('API Request Error (fallback failed):', fallbackError);
      throw fallbackError;
    }
    console.error('API Request Error:', error);
    throw error;
  }
};

// Token management utilities
export const tokenUtils = {
  get: getAuthToken,
  set: setAuthToken,
  remove: removeAuthToken,
  isAuthenticated: () => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      // If token is invalid, remove it
      removeAuthToken();
      return false;
    }
  }
};

// Local storage utilities for Sales data
export const salesStorage = {
  get: () => {
    try {
      const salesData = localStorage.getItem('salesUser');
      return salesData ? JSON.parse(salesData) : null;
    } catch (error) {
      console.error('Error parsing stored Sales data:', error);
      return null;
    }
  },
  
  set: (salesData) => {
    try {
      localStorage.setItem('salesUser', JSON.stringify(salesData));
    } catch (error) {
      console.error('Error storing Sales data:', error);
    }
  },
  
  clear: () => {
    removeAuthToken();
    localStorage.removeItem('salesUser');
  }
};

export default {
  apiRequest,
  tokenUtils,
  salesStorage
};
