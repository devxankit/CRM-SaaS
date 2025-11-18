import { apiRequest, tokenUtils, salesStorage } from './baseApiService';

// Sales Authentication Service - Only for login/logout functionality
export const salesAuthService = {
  // Login Sales
  login: async (email, password) => {
    try {
      const response = await apiRequest('/sales/login', {
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

  // Get Sales profile
  getProfile: async () => {
    try {
      const response = await apiRequest('/sales/profile', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout Sales
  logout: async () => {
    try {
      const response = await apiRequest('/sales/logout', {
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

  // Create demo Sales (for development only)
  createDemoSales: async () => {
    try {
      const response = await apiRequest('/sales/create-demo', {
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

  // Get stored Sales data
  getStoredSalesData: () => {
    return salesStorage.get();
  },

  // Store Sales data
  storeSalesData: (salesData) => {
    salesStorage.set(salesData);
  },

  // Clear all Sales data
  clearSalesData: () => {
    salesStorage.clear();
  }
};

// Export individual functions for convenience
export const {
  login: loginSales,
  getProfile: getSalesProfile,
  logout: logoutSales,
  createDemoSales,
  isAuthenticated: isSalesAuthenticated,
  getStoredSalesData,
  storeSalesData,
  clearSalesData
} = salesAuthService;

export default salesAuthService;
