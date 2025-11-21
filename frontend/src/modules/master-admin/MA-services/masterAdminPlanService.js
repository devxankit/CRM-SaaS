import { apiRequest } from './baseApiService';

class MasterAdminPlanService {
  // Get all plans
  async getAllPlans(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `/master-admin/plans${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  // Get plan by ID
  async getPlanById(id) {
    try {
      const response = await apiRequest(`/master-admin/plans/${id}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw error;
    }
  }

  // Create new plan
  async createPlan(planData) {
    try {
      const response = await apiRequest('/master-admin/plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      });
      return response;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  // Update plan
  async updatePlan(id, planData) {
    try {
      const response = await apiRequest(`/master-admin/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(planData)
      });
      return response;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  // Delete plan
  async deletePlan(id) {
    try {
      const response = await apiRequest(`/master-admin/plans/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }
}

export default new MasterAdminPlanService();

