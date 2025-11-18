import { apiRequest } from './baseApiService';

/**
 * Get client profile with project details
 * @param {string} clientId - Client ID
 * @returns {Promise} Client profile data
 */
export const getClientProfile = async (clientId) => {
  const url = `/sales/clients/${clientId}/profile`;
  return apiRequest(url, { method: 'GET' });
};

/**
 * Create payment receipt for client
 * @param {string} clientId - Client ID
 * @param {Object} paymentData - Payment data (amount, accountId, method, referenceId, notes)
 * @returns {Promise} Created payment receipt
 */
export const createPayment = async (clientId, paymentData) => {
  const url = `/sales/clients/${clientId}/payments`;
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

/**
 * Get accounts list (for payment dropdown)
 * @returns {Promise} List of active accounts
 */
export const getAccounts = async () => {
  const url = `/sales/accounts`;
  return apiRequest(url, { method: 'GET' });
};

/**
 * Create project request (accelerate/hold work)
 * @param {string} clientId - Client ID
 * @param {Object} requestData - Request data (requestType: 'accelerate_work' | 'hold_work', reason)
 * @returns {Promise} Created request
 */
export const createProjectRequest = async (clientId, requestData) => {
  const url = `/sales/clients/${clientId}/project-requests`;
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
};

/**
 * Get project requests for client
 * @param {string} clientId - Client ID
 * @returns {Promise} List of project requests
 */
export const getProjectRequests = async (clientId) => {
  const url = `/sales/clients/${clientId}/project-requests`;
  return apiRequest(url, { method: 'GET' });
};

/**
 * Increase project cost
 * @param {string} clientId - Client ID
 * @param {Object} costData - Cost data (amount, reason)
 * @returns {Promise} Updated project data
 */
export const increaseCost = async (clientId, costData) => {
  const url = `/sales/clients/${clientId}/increase-cost`;
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(costData)
  });
};

/**
 * Transfer client to another sales employee
 * @param {string} clientId - Client ID
 * @param {string} newSalesId - New sales employee ID
 * @param {string} reason - Optional reason for transfer
 * @returns {Promise} Transfer result
 */
export const transferClient = async (clientId, newSalesId, reason = '') => {
  const url = `/sales/clients/${clientId}/transfer`;
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      toSalesId: newSalesId,
      reason: reason
    })
  });
};

/**
 * Mark project as completed (No Dues)
 * @param {string} clientId - Client ID
 * @returns {Promise} Updated project data
 */
export const markCompleted = async (clientId) => {
  const url = `/sales/clients/${clientId}/mark-completed`;
  return apiRequest(url, {
    method: 'POST'
  });
};

/**
 * Get transaction history for client
 * @param {string} clientId - Client ID
 * @returns {Promise} List of transactions
 */
export const getTransactions = async (clientId) => {
  const url = `/sales/clients/${clientId}/transactions`;
  return apiRequest(url, { method: 'GET' });
};

/**
 * Get sales team list (for transfer dropdown)
 * @returns {Promise} List of sales employees
 */
export const getSalesTeam = async () => {
  const url = `/sales/team`;
  return apiRequest(url, { method: 'GET' });
};

export default {
  getClientProfile,
  createPayment,
  getAccounts,
  createProjectRequest,
  getProjectRequests,
  increaseCost,
  transferClient,
  markCompleted,
  getTransactions,
  getSalesTeam
};

