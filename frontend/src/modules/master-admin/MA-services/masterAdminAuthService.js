import { apiRequest, tokenUtils, masterAdminStorage } from './baseApiService';

// Master Admin Authentication Service
export const masterAdminAuthService = {
  // Login master admin
  login: async (email, password) => {
    try {
      const response = await apiRequest('/master-admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Store token in localStorage
      if (response.data && response.data.token) {
        tokenUtils.set(response.data.token);
      }

      // Store master admin data
      if (response.data && response.data.masterAdmin) {
        masterAdminStorage.set(response.data.masterAdmin);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get master admin profile
  getProfile: async () => {
    try {
      const response = await apiRequest('/master-admin/profile', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update master admin profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiRequest('/master-admin/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout master admin
  logout: async () => {
    try {
      const response = await apiRequest('/master-admin/logout', {
        method: 'POST'
      });

      // Remove token from localStorage
      tokenUtils.remove();
      masterAdminStorage.clear();

      return response;
    } catch (error) {
      // Even if logout fails on server, remove local token
      tokenUtils.remove();
      masterAdminStorage.clear();
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return tokenUtils.isAuthenticated();
  },

  // Get stored master admin data
  getStoredMasterAdminData: () => {
    return masterAdminStorage.get();
  },

  // Store master admin data
  storeMasterAdminData: (masterAdminData) => {
    masterAdminStorage.set(masterAdminData);
  },

  // Clear stored data
  clearStoredData: () => {
    masterAdminStorage.clear();
  }
};

export default masterAdminAuthService;


