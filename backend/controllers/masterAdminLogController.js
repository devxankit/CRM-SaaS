const ActivityLog = require('../models/ActivityLog');
const { createLog } = require('../utils/activityLogger');

// @desc    Get all logs
// @route   GET /api/master-admin/logs
// @access  Private (Master Admin only)
const getAllLogs = async (req, res) => {
  try {
    const { 
      type, 
      status, 
      search, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { user: { $regex: search, $options: 'i' } },
        { admin: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get logs with pagination
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get all logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching logs'
    });
  }
};

// @desc    Get log by ID
// @route   GET /api/master-admin/logs/:id
// @access  Private (Master Admin only)
const getLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { log }
    });

  } catch (error) {
    console.error('Get log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching log'
    });
  }
};

// @desc    Create log entry
// @route   POST /api/master-admin/logs
// @access  Private (Master Admin only)
const createLogEntry = async (req, res) => {
  try {
    const { type, action, user, status, metadata } = req.body;

    if (!type || !action || !user) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, action, and user'
      });
    }

    const log = await createLog(
      type,
      action,
      user,
      req.masterAdmin.name,
      status || 'info',
      metadata || {},
      req.ip,
      req.get('user-agent')
    );

    if (!log) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create log entry'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Log entry created successfully',
      data: { log }
    });

  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating log'
    });
  }
};

// @desc    Get log statistics
// @route   GET /api/master-admin/logs/statistics
// @access  Private (Master Admin only)
const getLogStatistics = async (req, res) => {
  try {
    // Count by type
    const subscriptionLogs = await ActivityLog.countDocuments({ type: 'subscription' });
    const userLogs = await ActivityLog.countDocuments({ type: 'user' });
    const paymentLogs = await ActivityLog.countDocuments({ type: 'payment' });
    const moduleLogs = await ActivityLog.countDocuments({ type: 'module' });
    const securityLogs = await ActivityLog.countDocuments({ type: 'security' });
    const companyLogs = await ActivityLog.countDocuments({ type: 'company' });

    // Count by status
    const successLogs = await ActivityLog.countDocuments({ status: 'success' });
    const warningLogs = await ActivityLog.countDocuments({ status: 'warning' });
    const errorLogs = await ActivityLog.countDocuments({ status: 'error' });
    const infoLogs = await ActivityLog.countDocuments({ status: 'info' });

    // Total logs
    const total = await ActivityLog.countDocuments();

    // Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentLogs = await ActivityLog.countDocuments({
      createdAt: { $gte: yesterday }
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        recentActivity: recentLogs,
        byType: {
          subscription: subscriptionLogs,
          user: userLogs,
          payment: paymentLogs,
          module: moduleLogs,
          security: securityLogs,
          company: companyLogs
        },
        byStatus: {
          success: successLogs,
          warning: warningLogs,
          error: errorLogs,
          info: infoLogs
        }
      }
    });

  } catch (error) {
    console.error('Get log statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching log statistics'
    });
  }
};

// @desc    Export logs
// @route   GET /api/master-admin/logs/export
// @access  Private (Master Admin only)
const exportLogs = async (req, res) => {
  try {
    const { 
      type, 
      status, 
      startDate, 
      endDate,
      format = 'json' 
    } = req.query;

    // Build query
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get all matching logs (no pagination for export)
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(10000); // Limit to 10k records for performance

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'Type,Action,User,Admin,Status,Timestamp,Metadata\n';
      const csvRows = logs.map(log => {
        const metadata = JSON.stringify(log.metadata || {}).replace(/"/g, '""');
        return `"${log.type}","${log.action}","${log.user}","${log.admin}","${log.status}","${log.createdAt}","${metadata}"`;
      }).join('\n');
      
      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
      res.status(200).send(csv);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        data: {
          logs,
          count: logs.length,
          exportedAt: new Date()
        }
      });
    }

  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting logs'
    });
  }
};

module.exports = {
  getAllLogs,
  getLogById,
  createLogEntry,
  getLogStatistics,
  exportLogs
};


