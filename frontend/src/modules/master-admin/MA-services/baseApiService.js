import { getApiUrl } from '../../../config/env';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('masterAdminToken');
};

// Helper function to set auth token
const setAuthToken = (token) => {
  localStorage.setItem('masterAdminToken', token);
};

// Helper function to remove auth token
const removeAuthToken = () => {
  localStorage.removeItem('masterAdminToken');
};

// Helper function to get auth headers
const getAuthHeaders = (isFormData = false) => {
  const token = getAuthToken();
  const headers = {};
  
  // Only set Content-Type if NOT FormData (browser will set it with boundary for FormData)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper to safely parse JSON response
const safeJsonParse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Check if response has content
  const text = await response.text();
  
  // If empty response
  if (!text || !text.trim()) {
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText} (Empty response)`);
    }
    return {};
  }
  
  // If not JSON (e.g., HTML error page)
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      // Try to extract error message from HTML or use status
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return { message: text };
  }
  
  // Parse JSON
  try {
    return JSON.parse(text);
  } catch (parseError) {
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    throw new Error('Invalid JSON response from server');
  }
};

// Base API request helper
export const apiRequest = async (url, options = {}) => {
  try {
    const primaryUrl = getApiUrl(url);
    
    // Check if body is FormData
    const isFormData = options.body instanceof FormData;
    
    const response = await fetch(primaryUrl, {
      ...options,
      headers: {
        ...getAuthHeaders(isFormData),
        // Don't override headers if FormData - let browser set Content-Type with boundary
        ...(isFormData ? {} : options.headers)
      },
      credentials: 'include' // Include cookies for CORS
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || data.error || `Server error: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Fallback: if direct host failed (e.g., backend not running on 5000), try same-origin /api path
    try {
      if (error && (error.name === 'TypeError' || String(error).includes('Failed to fetch') || String(error).includes('ERR_CONNECTION_REFUSED'))) {
        const sameOriginUrl = `/api${url.startsWith('/') ? url : `/${url}`}`;
        const isFormData = options.body instanceof FormData;
        const fallbackResponse = await fetch(sameOriginUrl, {
          ...options,
          headers: {
            ...getAuthHeaders(isFormData),
            // Don't override headers if FormData
            ...(isFormData ? {} : options.headers)
          },
          credentials: 'include'
        });
        
        const fallbackData = await safeJsonParse(fallbackResponse);
        
        if (!fallbackResponse.ok) {
          throw new Error(fallbackData.message || fallbackData.error || `Server error: ${fallbackResponse.status}`);
        }
        return fallbackData;
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

// Local storage utilities for master admin data
export const masterAdminStorage = {
  get: () => {
    try {
      const masterAdminData = localStorage.getItem('masterAdminUser');
      return masterAdminData ? JSON.parse(masterAdminData) : null;
    } catch (error) {
      console.error('Error parsing stored master admin data:', error);
      return null;
    }
  },
  
  set: (masterAdminData) => {
    try {
      localStorage.setItem('masterAdminUser', JSON.stringify(masterAdminData));
    } catch (error) {
      console.error('Error storing master admin data:', error);
    }
  },
  
  clear: () => {
    removeAuthToken();
    localStorage.removeItem('masterAdminUser');
  }
};

export default {
  apiRequest,
  tokenUtils,
  masterAdminStorage
};


