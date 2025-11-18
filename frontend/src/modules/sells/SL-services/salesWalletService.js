import { apiRequest } from './baseApiService'

const getWalletSummary = async () => {
  const res = await apiRequest('/sales/wallet/summary', { method: 'GET' })
  return res.data || {
    salary: { fixedSalary: 0 },
    incentive: { perClient: 0, current: 0, pending: 0, monthly: 0, allTime: 0, breakdown: [] },
    transactions: []
  }
}

export default {
  getWalletSummary
}


