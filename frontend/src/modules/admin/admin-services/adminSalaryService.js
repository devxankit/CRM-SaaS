// IMPORTANT: Always use './baseApiService' (admin) NOT '../../sells/SL-services/baseApiService' (sales)
// Admin routes require adminToken, not salesToken
import { apiRequest } from './baseApiService'

// Set employee fixed salary
const setEmployeeSalary = async (userType, employeeId, fixedSalary) => {
  const res = await apiRequest(`/admin/users/salary/set/${userType}/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify({ fixedSalary })
  })
  return res
}

// Get salary records with filters
const getSalaryRecords = async (params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.month) queryParams.append('month', params.month)
  if (params.department && params.department !== 'all') queryParams.append('department', params.department)
  if (params.status && params.status !== 'all') queryParams.append('status', params.status)
  if (params.search) queryParams.append('search', params.search)
  
  const query = queryParams.toString()
  const url = `/admin/users/salary${query ? `?${query}` : ''}`
  const res = await apiRequest(url, { method: 'GET' })
  return res
}

// Get single salary record
const getSalaryRecord = async (id) => {
  const res = await apiRequest(`/admin/users/salary/${id}`, { method: 'GET' })
  return res
}

// Update salary record (mark as paid, update payment details)
const updateSalaryRecord = async (id, updates) => {
  const res = await apiRequest(`/admin/users/salary/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  return res
}

// Generate monthly salaries for a specific month
const generateMonthlySalaries = async (month) => {
  const res = await apiRequest(`/admin/users/salary/generate/${month}`, {
    method: 'POST'
  })
  return res
}

// Get employee salary history (read-only)
const getEmployeeSalaryHistory = async (userType, employeeId) => {
  const res = await apiRequest(`/admin/users/salary/employee/${userType}/${employeeId}`, {
    method: 'GET'
  })
  return res
}

// Delete salary record (only pending, current/future months)
const deleteSalaryRecord = async (id) => {
  const res = await apiRequest(`/admin/users/salary/${id}`, {
    method: 'DELETE'
  })
  return res
}

// Update incentive payment status
const updateIncentivePayment = async (id, data) => {
  const res = await apiRequest(`/admin/users/salary/${id}/incentive`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return res
}

// Update reward payment status
const updateRewardPayment = async (id, data) => {
  const res = await apiRequest(`/admin/users/salary/${id}/reward`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return res
}

export const adminSalaryService = {
  setEmployeeSalary,
  getSalaryRecords,
  getSalaryRecord,
  updateSalaryRecord,
  generateMonthlySalaries,
  getEmployeeSalaryHistory,
  deleteSalaryRecord,
  updateIncentivePayment,
  updateRewardPayment
}

export default adminSalaryService
