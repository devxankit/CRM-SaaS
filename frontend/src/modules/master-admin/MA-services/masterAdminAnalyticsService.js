import { apiRequest } from './baseApiService';

class MasterAdminAnalyticsService {
  // Get dashboard overview
  async getDashboardOverview() {
    try {
      const response = await apiRequest('/master-admin/analytics/dashboard', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }

  // Get revenue trend
  async getRevenueTrend(months = 6) {
    try {
      const response = await apiRequest(`/master-admin/analytics/revenue-trend?months=${months}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching revenue trend:', error);
      throw error;
    }
  }

  // Get module statistics
  async getModuleStatistics() {
    try {
      const response = await apiRequest('/master-admin/analytics/modules', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching module statistics:', error);
      throw error;
    }
  }

  // Get plan distribution
  async getPlanDistribution() {
    try {
      const response = await apiRequest('/master-admin/analytics/plan-distribution', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching plan distribution:', error);
      throw error;
    }
  }

  // Get company growth
  async getCompanyGrowth(months = 6) {
    try {
      const response = await apiRequest(`/master-admin/analytics/company-growth?months=${months}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching company growth:', error);
      throw error;
    }
  }

  // Get user growth
  async getUserGrowth(months = 6) {
    try {
      const response = await apiRequest(`/master-admin/analytics/user-growth?months=${months}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching user growth:', error);
      throw error;
    }
  }
}

export default new MasterAdminAnalyticsService();


