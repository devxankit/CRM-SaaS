import { apiRequest, tokenUtils, employeeStorage } from './employeeBaseApiService';

// Employee Authentication Service - Only for login/logout functionality
export const employeeAuthService = {
  // Login Employee
  login: async (email, password) => {
    try {
      const response = await apiRequest('/employee/login', {
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

  // Get Employee profile
  getProfile: async () => {
    try {
      const response = await apiRequest('/employee/profile', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout Employee
  logout: async () => {
    try {
      const response = await apiRequest('/employee/logout', {
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

  // Create demo Employee (for development only)
  createDemoEmployee: async () => {
    try {
      const response = await apiRequest('/employee/create-demo', {
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

  // Get stored Employee data
  getStoredEmployeeData: () => {
    return employeeStorage.get();
  },

  // Store Employee data
  storeEmployeeData: (employeeData) => {
    employeeStorage.set(employeeData);
  },

  // Clear all Employee data
  clearEmployeeData: () => {
    employeeStorage.clear();
  }
};

// Export individual functions for convenience
export const {
  login: loginEmployee,
  getProfile: getEmployeeProfile,
  logout: logoutEmployee,
  createDemoEmployee,
  isAuthenticated: isEmployeeAuthenticated,
  getStoredEmployeeData,
  storeEmployeeData,
  clearEmployeeData
} = employeeAuthService;

export default employeeAuthService;
