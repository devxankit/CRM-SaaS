const express = require('express');
const {
  getAllLogs,
  getLogById,
  createLogEntry,
  getLogStatistics,
  exportLogs
} = require('../controllers/masterAdminLogController');
const { protect, isMasterAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require master-admin authentication
router.use(protect);
router.use(isMasterAdmin);

router.get('/statistics', getLogStatistics);
router.get('/export', exportLogs);
router.post('/', createLogEntry);
router.get('/:id', getLogById);
router.get('/', getAllLogs); // This should be last to avoid matching other routes

module.exports = router;


