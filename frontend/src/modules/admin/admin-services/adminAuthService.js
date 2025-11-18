import { apiRequest, tokenUtils, adminStorage } from './baseApiService';

// Admin Authentication Service - Only for login/logout functionality
export const adminAuthService = {
  // Login admin
  login: async (email, password) => {
    try {
      const response = await apiRequest('/admin/login', {
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

  // Get admin profile
  getProfile: async () => {
    try {
      const response = await apiRequest('/admin/profile', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout admin
  logout: async () => {
    try {
      const response = await apiRequest('/admin/logout', {
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

  // Create demo admin (for development only)
  createDemoAdmin: async () => {
    try {
      const response = await apiRequest('/admin/create-demo', {
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

  // Get stored admin data
  getStoredAdminData: () => {
    return adminStorage.get();
  },

  // Store admin data
  storeAdminData: (adminData) => {
    adminStorage.set(adminData);
  },

  // Clear all admin data
  clearAdminData: () => {
    adminStorage.clear();
  }
};

// Export individual functions for convenience
export const {
  login: loginAdmin,
  getProfile: getAdminProfile,
  logout: logoutAdmin,
  createDemoAdmin,
  isAuthenticated: isAdminAuthenticated,
  getStoredAdminData,
  storeAdminData,
  clearAdminData
} = adminAuthService;

export default adminAuthService;
