import { apiRequest } from './baseApiService';

class MasterAdminSubscriptionService {
  // Get all subscriptions
  async getAllSubscriptions(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `/master-admin/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  // Get subscription by ID
  async getSubscriptionById(id) {
    try {
      const response = await apiRequest(`/master-admin/subscriptions/${id}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  // Create new subscription
  async createSubscription(subscriptionData) {
    try {
      const response = await apiRequest('/master-admin/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData)
      });
      return response;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(id, subscriptionData) {
    try {
      const response = await apiRequest(`/master-admin/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(subscriptionData)
      });
      return response;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(id, reason) {
    try {
      const response = await apiRequest(`/master-admin/subscriptions/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
      return response;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Suspend subscription
  async suspendSubscription(id) {
    try {
      const response = await apiRequest(`/master-admin/subscriptions/${id}/suspend`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error suspending subscription:', error);
      throw error;
    }
  }

  // Activate subscription
  async activateSubscription(id) {
    try {
      const response = await apiRequest(`/master-admin/subscriptions/${id}/activate`, {
        method: 'PATCH'
      });
      return response;
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  // Get subscription statistics
  async getSubscriptionStatistics() {
    try {
      const response = await apiRequest('/master-admin/subscriptions/statistics', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching subscription statistics:', error);
      throw error;
    }
  }

  // Get upcoming billings
  async getUpcomingBillings(days = 30) {
    try {
      const response = await apiRequest(`/master-admin/subscriptions/upcoming-billings?days=${days}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching upcoming billings:', error);
      throw error;
    }
  }
}

export default new MasterAdminSubscriptionService();


