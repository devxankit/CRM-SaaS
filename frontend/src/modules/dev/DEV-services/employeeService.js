import { apiRequest, tokenUtils, employeeStorage } from './employeeBaseApiService';

// Employee Service - Following the same pattern as other services
const employeeService = {
  // Dashboard and Analytics
  async getEmployeeDashboardStats() {
    try {
      const response = await apiRequest('/employee/analytics/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
  },

  async getEmployeePerformanceStats() {
    try {
      const response = await apiRequest('/employee/analytics/performance');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch performance stats: ${error.message}`);
    }
  },

  async getEmployeeLeaderboard(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/employee/analytics/leaderboard${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }
  },

  async getEmployeePointsHistory(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/employee/analytics/points-history${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch points history: ${error.message}`);
    }
  },

  // Projects
  async getEmployeeProjects(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/employee/projects${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
  },

  async getEmployeeProjectById(id) {
    try {
      const response = await apiRequest(`/employee/projects/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
  },

  async getEmployeeProjectMilestones(projectId) {
    try {
      const response = await apiRequest(`/employee/projects/${projectId}/milestones`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch project milestones: ${error.message}`);
    }
  },

  async getEmployeeProjectStatistics() {
    try {
      const response = await apiRequest('/employee/projects/statistics');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch project statistics: ${error.message}`);
    }
  },

  // Milestones
  async getEmployeeMilestoneById(id) {
    try {
      const response = await apiRequest(`/employee/milestones/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch milestone: ${error.message}`);
    }
  },

  async getEmployeeMilestoneTasks(milestoneId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/employee/milestones/${milestoneId}/tasks${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch milestone tasks: ${error.message}`);
    }
  },

  async addEmployeeMilestoneComment(milestoneId, message) {
    try {
      const response = await apiRequest(`/employee/milestones/${milestoneId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add milestone comment: ${error.message}`);
    }
  },

  // Tasks
  async getEmployeeTasks(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/employee/tasks${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
  },

  async getEmployeeTaskById(id) {
    try {
      const response = await apiRequest(`/employee/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch task: ${error.message}`);
    }
  },

  async updateEmployeeTaskStatus(id, status, actualHours, comments) {
    try {
      const response = await apiRequest(`/employee/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          actualHours,
          comments
        })
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  },

  async addEmployeeTaskComment(id, message) {
    try {
      const response = await apiRequest(`/employee/tasks/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add task comment: ${error.message}`);
    }
  },

  async getEmployeeUrgentTasks(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/employee/tasks/urgent${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch urgent tasks: ${error.message}`);
    }
  },

  async getEmployeeTaskStatistics() {
    try {
      const response = await apiRequest('/employee/tasks/statistics');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch task statistics: ${error.message}`);
    }
  },

  // File Uploads
  async uploadTaskAttachment(taskId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest(`/employee/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload attachment: ${error.message}`);
    }
  },

  async getTaskAttachments(taskId) {
    try {
      const response = await apiRequest(`/employee/tasks/${taskId}/attachments`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch task attachments: ${error.message}`);
    }
  },

  async deleteTaskAttachment(taskId, attachmentId) {
    try {
      const response = await apiRequest(`/employee/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete attachment: ${error.message}`);
    }
  },

  // Utility methods
  async downloadAttachment(attachmentUrl, filename) {
    try {
      const response = await fetch(attachmentUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download attachment: ${error.message}`);
    }
  },

  // Performance and Analytics helpers
  async getEmployeePerformance() {
    try {
      const response = await apiRequest('/employee/analytics/performance');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch employee performance: ${error.message}`);
    }
  },

  // Leaderboard helpers
  async getLeaderboardData(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/employee/analytics/leaderboard${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch leaderboard data: ${error.message}`);
    }
  },

  // Points history helpers
  async getPointsHistory(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/employee/analytics/points-history${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch points history: ${error.message}`);
    }
  }
};

export default employeeService;
