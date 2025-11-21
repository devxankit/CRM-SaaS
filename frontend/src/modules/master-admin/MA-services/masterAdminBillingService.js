import { apiRequest } from './baseApiService';

class MasterAdminBillingService {
  // Get all payments
  async getAllPayments(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `/master-admin/billing/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(id) {
    try {
      const response = await apiRequest(`/master-admin/billing/payments/${id}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  // Create payment
  async createPayment(paymentData) {
    try {
      const response = await apiRequest('/master-admin/billing/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      return response;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  // Update payment
  async updatePayment(id, paymentData) {
    try {
      const response = await apiRequest(`/master-admin/billing/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(paymentData)
      });
      return response;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(id, status) {
    try {
      const response = await apiRequest(`/master-admin/billing/payments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Get payment statistics
  async getPaymentStatistics() {
    try {
      const response = await apiRequest('/master-admin/billing/payments/statistics', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      throw error;
    }
  }

  // Get payment history for company
  async getPaymentHistory(companyId) {
    try {
      const response = await apiRequest(`/master-admin/billing/payments/company/${companyId}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Generate invoice
  async generateInvoice(id) {
    try {
      const response = await apiRequest(`/master-admin/billing/payments/${id}/invoice`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }
}

export default new MasterAdminBillingService();


