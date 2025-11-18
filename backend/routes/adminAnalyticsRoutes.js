const express = require('express');
const {
  getAdminDashboardStats,
  getSystemAnalytics,
  getAdminLeaderboard,
  getRecentActivities
} = require('../controllers/adminAnalyticsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// Admin analytics routes
router.get('/dashboard', getAdminDashboardStats);
router.get('/system', getSystemAnalytics);
router.get('/leaderboard', getAdminLeaderboard);
router.get('/recent-activities', getRecentActivities);

module.exports = router;
