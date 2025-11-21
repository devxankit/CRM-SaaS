const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['subscription', 'user', 'payment', 'module', 'security', 'company'],
    required: [true, 'Log type is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true
  },
  user: {
    type: String,
    required: [true, 'User/Company name is required'],
    trim: true
  },
  admin: {
    type: String,
    required: [true, 'Admin name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error', 'info'],
    default: 'info'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ type: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ admin: 1 });
activityLogSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);


