import { apiRequest } from './baseApiService';

// Dashboard & Statistics
export const getDashboardStatistics = async () => {
  try {
    const response = await apiRequest('/sales/dashboard/statistics', {
      method: 'GET'
    });
    
    // The backend returns { success: true, data: { statusCounts, totalLeads } }
    if (response.success && response.data) {
      return response.data;
    } else {
      console.error('Invalid response structure:', response);
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    // Return default stats if API fails
    return {
      statusCounts: {
        new: 0,
        connected: 0,
        not_picked: 0,
        followup: 0, // Changed from today_followup to followup to match backend
        quotation_sent: 0,
        dq_sent: 0,
        app_client: 0,
        web: 0,
        converted: 0,
        lost: 0,
        hot: 0,
        demo_requested: 0,
        not_interested: 0
      },
      totalLeads: 0
    };
  }
};

// Lead Management
export const getMyLeads = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add parameters if they exist
    if (params.status) queryParams.append('status', params.status);
    if (params.category) queryParams.append('category', params.category);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/sales/leads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url, {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Error fetching leads:', error);
    // Return empty response if API fails
    return {
      data: [],
      count: 0,
      total: 0,
      page: 1,
      pages: 0
    };
  }
};

export const getLeadsByStatus = async (status, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add parameters if they exist
    if (params.category) queryParams.append('category', params.category);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `/sales/leads/status/${status}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiRequest(url, {
      method: 'GET'
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching leads by status:', error);
    // Return empty response if API fails
    return {
      data: [],
      count: 0,
      total: 0,
      page: 1,
      pages: 0,
      status: status
    };
  }
};

export const getLeadDetail = async (leadId) => {
  try {
    const response = await apiRequest(`/sales/leads/${leadId}`, {
      method: 'GET'
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching lead detail:', error);
    throw error;
  }
};

export const updateLeadStatus = async (leadId, status, payload = '') => {
  try {
    let requestBody = { status };
    
    // Handle different payload types for backward compatibility
    if (typeof payload === 'string') {
      // Legacy: notes as string
      requestBody.notes = payload;
    } else if (typeof payload === 'object' && payload !== null) {
      // New: follow-up data object
      requestBody = {
        ...requestBody,
        ...payload
      };
    }
    
    const response = await apiRequest(`/sales/leads/${leadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody)
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};

// LeadProfile Management
export const createLeadProfile = async (leadId, profileData) => {
  try {
    const response = await apiRequest(`/sales/leads/${leadId}/profile`, {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
    return response.data;
  } catch (error) {
    console.error('Error creating lead profile:', error);
    throw error;
  }
};

export const updateLeadProfile = async (leadId, profileData) => {
  try {
    const response = await apiRequest(`/sales/leads/${leadId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return response.data;
  } catch (error) {
    console.error('Error updating lead profile:', error);
    throw error;
  }
};

export const convertLeadToClient = async (leadId, projectData) => {
  try {
    const token = localStorage.getItem('salesToken');
    const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sales/leads/${leadId}/convert`;
    
    // Check if screenshot file exists
    if (projectData.screenshot && projectData.screenshot instanceof File) {
      // Use FormData for file upload
      const formData = new FormData();
      
      // Append all fields to FormData
      formData.append('projectName', projectData.projectName || '');
      formData.append('projectType', JSON.stringify(projectData.projectType || { web: false, app: false, taxi: false }));
      formData.append('totalCost', projectData.totalCost || 0);
      if (projectData.finishedDays) formData.append('finishedDays', projectData.finishedDays);
      formData.append('advanceReceived', projectData.advanceReceived || 0);
      formData.append('includeGST', projectData.includeGST || false);
      formData.append('description', projectData.description || '');
      formData.append('screenshot', projectData.screenshot);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data.data || data;
    } else {
      // Use JSON for regular request
      const response = await apiRequest(`/sales/leads/${leadId}/convert`, {
        method: 'POST',
        body: JSON.stringify({ projectData })
      });
      return response.data;
    }
  } catch (error) {
    console.error('Error converting lead:', error);
    throw error;
  }
};

export const getLeadCategories = async () => {
  try {
    const response = await apiRequest('/sales/lead-categories', {
      method: 'GET'
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Create a new lead
export const createLead = async (leadData) => {
  try {
    const response = await apiRequest('/sales/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
    return response;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

// Utility functions for status management
export const getStatusDisplayName = (status) => {
  const statusMap = {
    'new': 'New',
    'connected': 'Connected',
    'not_picked': 'Not Picked',
    'followup': 'Follow Up',
    'today_followup': 'Today Followup', // Backward compatibility
    'quotation_sent': 'Quotation Sent',
    'dq_sent': 'DQ Sent',
    'app_client': 'App Client',
    'web': 'Web',
    'converted': 'Converted',
    'lost': 'Lost',
    'not_interested': 'Not Interested',
    'hot': 'Hot',
    'demo_requested': 'Demo Requested'
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status) => {
  const colorMap = {
    'new': 'bg-blue-100 text-blue-800',
    'connected': 'bg-green-100 text-green-800',
    'not_picked': 'bg-gray-100 text-gray-800',
    'followup': 'bg-yellow-100 text-yellow-800',
    'today_followup': 'bg-yellow-100 text-yellow-800', // Backward compatibility
    'quotation_sent': 'bg-purple-100 text-purple-800',
    'dq_sent': 'bg-indigo-100 text-indigo-800',
    'app_client': 'bg-pink-100 text-pink-800',
    'web': 'bg-cyan-100 text-cyan-800',
    'converted': 'bg-emerald-100 text-emerald-800',
    'lost': 'bg-red-100 text-red-800',
    'not_interested': 'bg-orange-100 text-orange-800',
    'hot': 'bg-orange-100 text-orange-800',
    'demo_requested': 'bg-teal-100 text-teal-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getValidStatusTransitions = (currentStatus) => {
  const transitions = {
    'new': ['connected', 'not_picked', 'not_interested', 'lost'],
    'connected': ['hot', 'followup', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'demo_requested', 'not_interested', 'lost'],
    'not_picked': ['connected', 'followup', 'not_interested', 'lost'],
    'followup': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'demo_requested', 'not_interested', 'lost'],
    'today_followup': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'demo_requested', 'not_interested', 'lost'], // Backward compatibility
    'quotation_sent': ['connected', 'hot', 'dq_sent', 'app_client', 'web', 'demo_requested', 'converted', 'not_interested', 'lost'],
    'dq_sent': ['connected', 'hot', 'quotation_sent', 'app_client', 'web', 'demo_requested', 'converted', 'not_interested', 'lost'],
    'app_client': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'web', 'demo_requested', 'converted', 'not_interested', 'lost'],
    'web': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'app_client', 'demo_requested', 'converted', 'not_interested', 'lost'],
    'demo_requested': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'converted', 'not_interested', 'lost'],
    'hot': ['quotation_sent', 'dq_sent', 'app_client', 'web', 'demo_requested', 'converted', 'not_interested', 'lost'],
    'converted': [],
    'lost': ['connected'],
    'not_interested': ['connected']
  };
  return transitions[currentStatus] || [];
};

// Get all sales team members
export const getSalesTeam = async () => {
  try {
    const response = await apiRequest('/sales/team', {
      method: 'GET'
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sales team:', error);
    return [];
  }
};

// Request demo for lead
export const requestDemo = async (leadId, demoData) => {
  try {
    const response = await apiRequest(`/sales/leads/${leadId}/request-demo`, {
      method: 'POST',
      body: JSON.stringify(demoData)
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting demo:', error);
    throw error;
  }
};

// Transfer lead to another sales employee
export const transferLead = async (leadId, transferData) => {
  try {
    const response = await apiRequest(`/sales/leads/${leadId}/transfer`, {
      method: 'POST',
      body: JSON.stringify(transferData)
    });
    return response.data;
  } catch (error) {
    console.error('Error transferring lead:', error);
    throw error;
  }
};

// Add note to lead profile
export const addNoteToLead = async (leadId, noteData) => {
  try {
    const response = await apiRequest(`/sales/leads/${leadId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
    return response.data;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

// Default export with all functions
const salesLeadService = {
  getDashboardStatistics,
  getMyLeads,
  getLeadsByStatus,
  getLeadDetail,
  updateLeadStatus,
  createLeadProfile,
  updateLeadProfile,
  convertLeadToClient,
  getLeadCategories,
  createLead,
  getStatusDisplayName,
  getStatusColor,
  getValidStatusTransitions,
  getSalesTeam,
  requestDemo,
  transferLead,
  addNoteToLead
};

export default salesLeadService;
