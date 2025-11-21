const express = require('express');
const {
  getDashboardOverview,
  getRevenueTrend,
  getModuleStatistics,
  getPlanDistribution,
  getCompanyGrowth,
  getUserGrowth
} = require('../controllers/masterAdminAnalyticsController');
const { protect, isMasterAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require master-admin authentication
router.use(protect);
router.use(isMasterAdmin);

router.get('/dashboard', getDashboardOverview);
router.get('/revenue-trend', getRevenueTrend);
router.get('/modules', getModuleStatistics);
router.get('/plan-distribution', getPlanDistribution);
router.get('/company-growth', getCompanyGrowth);
router.get('/user-growth', getUserGrowth);

module.exports = router;


