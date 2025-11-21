const express = require('express');
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  getPaymentStatistics,
  getPaymentHistory,
  generateInvoice
} = require('../controllers/masterAdminBillingController');
const { protect, isMasterAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require master-admin authentication
router.use(protect);
router.use(isMasterAdmin);

router.get('/payments/statistics', getPaymentStatistics);
router.get('/payments/company/:companyId', getPaymentHistory);
router.post('/payments/:id/invoice', generateInvoice);
router.get('/payments/:id', getPaymentById);
router.put('/payments/:id', updatePayment);
router.patch('/payments/:id/status', updatePaymentStatus);
router.post('/payments', createPayment);
router.get('/payments', getAllPayments); // This should be last to avoid matching other routes

module.exports = router;


