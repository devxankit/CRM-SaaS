const express = require('express');
const {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  suspendSubscription,
  activateSubscription,
  getSubscriptionStatistics,
  getUpcomingBillings
} = require('../controllers/masterAdminSubscriptionController');
const { protect, isMasterAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require master-admin authentication
router.use(protect);
router.use(isMasterAdmin);

router.post('/', createSubscription);
router.get('/statistics', getSubscriptionStatistics);
router.get('/upcoming-billings', getUpcomingBillings);
router.get('/:id', getSubscriptionById);
router.put('/:id', updateSubscription);
router.patch('/:id/cancel', cancelSubscription);
router.patch('/:id/suspend', suspendSubscription);
router.patch('/:id/activate', activateSubscription);
router.get('/', getAllSubscriptions); // This should be last to avoid matching other routes

module.exports = router;


