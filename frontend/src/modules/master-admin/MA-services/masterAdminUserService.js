import { apiRequest } from './baseApiService';

class MasterAdminUserService {
  // Get all users
  async getAllUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `/master-admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userType, id) {
    try {
      const response = await apiRequest(`/master-admin/users/${userType}/${id}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStatistics() {
    try {
      const response = await apiRequest('/master-admin/users/statistics', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }

  // Get users by company
  async getUsersByCompany(companyId) {
    try {
      const response = await apiRequest(`/master-admin/users/company/${companyId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching users by company:', error);
      throw error;
    }
  }

  // Deactivate user
  async deactivateUser(userType, id) {
    try {
      const response = await apiRequest(`/master-admin/users/${userType}/${id}/deactivate`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  // Activate user
  async activateUser(userType, id) {
    try {
      const response = await apiRequest(`/master-admin/users/${userType}/${id}/activate`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  }
}

export default new MasterAdminUserService();


