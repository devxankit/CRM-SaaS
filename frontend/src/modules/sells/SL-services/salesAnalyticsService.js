import { apiRequest } from './baseApiService';

// Sales Analytics Service
// Provides dashboard stats and monthly conversions

const getDashboardStats = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = `/sales/dashboard/stats${query ? `?${query}` : ''}`;
  return apiRequest(url, { method: 'GET' });
};

const getMonthlyConversions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = `/sales/analytics/conversions/monthly${query ? `?${query}` : ''}`;
  return apiRequest(url, { method: 'GET' });
};

const getTileCardStats = async () => {
  const url = `/sales/dashboard/tile-stats`;
  return apiRequest(url, { method: 'GET' });
};

const getDashboardHeroStats = async () => {
  const url = `/sales/dashboard/hero-stats`;
  return apiRequest(url, { method: 'GET' });
};

export default {
  getDashboardStats,
  getMonthlyConversions,
  getTileCardStats,
  getDashboardHeroStats
};


