import { apiRequest } from './baseApiService';

class MasterAdminCompanyService {
  // Get all companies
  async getAllCompanies(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `/master-admin/companies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  // Get company by ID
  async getCompanyById(id) {
    try {
      const response = await apiRequest(`/master-admin/companies/${id}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  // Create new company
  async createCompany(companyData) {
    try {
      const response = await apiRequest('/master-admin/companies', {
        method: 'POST',
        body: JSON.stringify(companyData)
      });
      return response;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  // Update company
  async updateCompany(id, companyData) {
    try {
      const response = await apiRequest(`/master-admin/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(companyData)
      });
      return response;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  // Delete company
  async deleteCompany(id) {
    try {
      const response = await apiRequest(`/master-admin/companies/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Get company statistics
  async getCompanyStatistics() {
    try {
      const response = await apiRequest('/master-admin/companies/statistics', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching company statistics:', error);
      throw error;
    }
  }

  // Suspend company
  async suspendCompany(id) {
    try {
      const response = await apiRequest(`/master-admin/companies/${id}/suspend`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error suspending company:', error);
      throw error;
    }
  }

  // Activate company
  async activateCompany(id) {
    try {
      const response = await apiRequest(`/master-admin/companies/${id}/activate`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error activating company:', error);
      throw error;
    }
  }
}

export default new MasterAdminCompanyService();


