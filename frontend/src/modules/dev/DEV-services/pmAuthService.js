import { apiRequest, tokenUtils, pmStorage } from './baseApiService';

// PM Authentication Service - Only for login/logout functionality
export const pmAuthService = {
  // Login PM
  login: async (email, password) => {
    try {
      const response = await apiRequest('/pm/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Store token in localStorage
      if (response.data && response.data.token) {
        tokenUtils.set(response.data.token);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get PM profile
  getProfile: async () => {
    try {
      const response = await apiRequest('/pm/profile', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout PM
  logout: async () => {
    try {
      const response = await apiRequest('/pm/logout', {
        method: 'POST'
      });

      // Remove token from localStorage
      tokenUtils.remove();

      return response;
    } catch (error) {
      // Even if logout fails on server, remove local token
      tokenUtils.remove();
      throw error;
    }
  },

  // Create demo PM (for development only)
  createDemoPM: async () => {
    try {
      const response = await apiRequest('/pm/create-demo', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return tokenUtils.isAuthenticated();
  },

  // Get stored PM data
  getStoredPMData: () => {
    return pmStorage.get();
  },

  // Store PM data
  storePMData: (pmData) => {
    pmStorage.set(pmData);
  },

  // Clear all PM data
  clearPMData: () => {
    pmStorage.clear();
  }
};

// Export individual functions for convenience
export const {
  login: loginPM,
  getProfile: getPMProfile,
  logout: logoutPM,
  createDemoPM,
  isAuthenticated: isPMAuthenticated,
  getStoredPMData,
  storePMData,
  clearPMData
} = pmAuthService;

export default pmAuthService;
