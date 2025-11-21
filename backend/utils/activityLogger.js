const ActivityLog = require('../models/ActivityLog');

/**
 * Create an activity log entry
 * @param {String} type - Log type: 'subscription', 'user', 'payment', 'module', 'security', 'company'
 * @param {String} action - Action description
 * @param {String} user - User/Company name
 * @param {String} admin - Master admin name
 * @param {String} status - Status: 'success', 'warning', 'error', 'info'
 * @param {Object} metadata - Additional metadata object
 * @param {String} ipAddress - IP address (optional)
 * @param {String} userAgent - User agent (optional)
 * @returns {Promise<Object>} Created log entry
 */
const createLog = async (type, action, user, admin, status = 'info', metadata = {}, ipAddress = null, userAgent = null) => {
  try {
    const log = await ActivityLog.create({
      type,
      action,
      user,
      admin,
      status,
      metadata,
      ipAddress,
      userAgent
    });

    return log;
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Don't throw error - logging should not break the main flow
    return null;
  }
};

module.exports = {
  createLog
};


