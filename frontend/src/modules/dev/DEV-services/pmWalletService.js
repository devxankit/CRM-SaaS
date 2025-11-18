import { apiRequest } from './baseApiService';

/**
 * PM Wallet Service
 * Handles all wallet-related API calls for Project Managers
 */

export const pmWalletService = {
  /**
   * Get wallet summary (salary, rewards, total earnings)
   * @returns {Promise} Wallet summary data
   */
  getWalletSummary: async () => {
    try {
      const response = await apiRequest('/pm/wallet/summary', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Error fetching wallet summary:', error);
      throw error;
    }
  },

  /**
   * Get wallet transactions (salary and rewards history)
   * @param {number} limit - Maximum number of transactions to fetch
   * @returns {Promise} Transactions data
   */
  getWalletTransactions: async (limit = 50) => {
    try {
      const response = await apiRequest(`/pm/wallet/transactions?limit=${limit}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  }
};

export default pmWalletService;

