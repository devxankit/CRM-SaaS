import { apiRequest } from './baseApiService';
import { getApiUrl } from '../../../config/env';

class MasterAdminLogService {
  // Get all logs
  async getAllLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const url = `/master-admin/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiRequest(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  // Get log by ID
  async getLogById(id) {
    try {
      const response = await apiRequest(`/master-admin/logs/${id}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching log:', error);
      throw error;
    }
  }

  // Create log entry
  async createLogEntry(logData) {
    try {
      const response = await apiRequest('/master-admin/logs', {
        method: 'POST',
        body: JSON.stringify(logData)
      });
      return response;
    } catch (error) {
      console.error('Error creating log entry:', error);
      throw error;
    }
  }

  // Get log statistics
  async getLogStatistics() {
    try {
      const response = await apiRequest('/master-admin/logs/statistics', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching log statistics:', error);
      throw error;
    }
  }

  // Export logs
  async exportLogs(params = {}, format = 'json') {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      queryParams.append('format', format);

      const url = `/master-admin/logs/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      if (format === 'csv') {
        // For CSV, we need to handle blob response
        const response = await fetch(getApiUrl(url), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('masterAdminToken')}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to export logs');
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `activity-logs-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        return { success: true, message: 'Logs exported successfully' };
      } else {
        const response = await apiRequest(url, { method: 'GET' });
        return response;
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  }
}

export default new MasterAdminLogService();

