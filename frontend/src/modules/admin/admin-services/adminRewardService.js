import { apiRequest } from './baseApiService'

const buildQueryString = (params = {}) => {
  const pairs = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')

  if (pairs.length === 0) {
    return ''
  }

  const searchParams = new URLSearchParams()
  pairs.forEach(([key, value]) => {
    searchParams.append(key, value)
  })

  return `?${searchParams.toString()}`
}

export const adminRewardService = {
  getRewards: async (filters = {}) => {
    const query = buildQueryString(filters)
    return apiRequest(`/admin/rewards${query}`, {
      method: 'GET'
    })
  },

  createReward: async (payload) => {
    return apiRequest('/admin/rewards', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  toggleRewardStatus: async (rewardId) => {
    return apiRequest(`/admin/rewards/${rewardId}/toggle`, {
      method: 'PATCH'
    })
  },

  deleteReward: async (rewardId) => {
    return apiRequest(`/admin/rewards/${rewardId}`, {
      method: 'DELETE'
    })
  },

  getTags: async () => {
    return apiRequest('/admin/rewards/tags', {
      method: 'GET'
    })
  },

  createTag: async (payload) => {
    return apiRequest('/admin/rewards/tags', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  deleteTag: async (tagId) => {
    return apiRequest(`/admin/rewards/tags/${tagId}`, {
      method: 'DELETE'
    })
  }
}

export default adminRewardService

