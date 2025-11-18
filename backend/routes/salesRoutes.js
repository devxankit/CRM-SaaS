const express = require('express');
const {
  loginSales,
  getSalesProfile,
  logoutSales,
  createDemoSales,
  createLeadBySales,
  getLeadCategories,
  debugLeads,
  getSalesDashboardStats,
  getDashboardStats,
  getMonthlyConversions,
  getWalletSummary,
  getMyLeads,
  getLeadsByStatus,
  getLeadDetail,
  updateLeadStatus,
  createLeadProfile,
  updateLeadProfile,
  convertLeadToClient,
  getSalesTeam,
  requestDemo,
  transferLead,
  addNoteToLead
} = require('../controllers/salesController');
const { getPublishedNoticesForSales, incrementNoticeViews } = require('../controllers/noticeController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// Public routes
router.post('/login', loginSales);
router.post('/create-demo', createDemoSales); // Remove in production

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Sales API is working' });
});

// Protected routes
router.use(protect); // All routes below this middleware are protected

router.get('/profile', getSalesProfile);
router.post('/logout', logoutSales);

// Lead management routes
router.post('/leads', createLeadBySales);
router.get('/lead-categories', getLeadCategories);

// Dashboard & Statistics
router.get('/debug/leads', debugLeads);
router.get('/dashboard/tile-stats', require('../controllers/salesController').getTileCardStats);
router.get('/dashboard/hero-stats', require('../controllers/salesController').getDashboardHeroStats);
router.get('/dashboard/statistics', getSalesDashboardStats);
// Alias path per plan
router.get('/dashboard/stats', getDashboardStats);
// Monthly conversions for bar chart
router.get('/analytics/conversions/monthly', getMonthlyConversions);

// Lead Management
router.get('/leads', getMyLeads);
router.get('/leads/status/:status', getLeadsByStatus);
router.get('/leads/:id', getLeadDetail);
router.patch('/leads/:id/status', updateLeadStatus);

// LeadProfile Management
router.post('/leads/:id/profile', createLeadProfile);
router.put('/leads/:id/profile', updateLeadProfile);

// Lead Conversion
router.post('/leads/:id/convert', upload.single('screenshot'), convertLeadToClient);

// Team Management
router.get('/team', getSalesTeam);

// Lead Actions
router.post('/leads/:id/request-demo', requestDemo);
router.post('/leads/:id/transfer', transferLead);
router.post('/leads/:id/notes', addNoteToLead);

// Accounts (read-only for sales)
router.get('/accounts', require('../controllers/salesController').getAccounts);

// Payment Recovery
router.get('/payment-recovery', require('../controllers/salesController').getPaymentRecovery);
router.get('/payment-recovery/stats', require('../controllers/salesController').getPaymentRecoveryStats);
router.post('/payment-recovery/:projectId/receipts', require('../controllers/salesController').createPaymentReceipt);
router.get('/payment-recovery/:projectId/installments', require('../controllers/salesController').getProjectInstallments);
router.post('/payment-recovery/:projectId/installments/:installmentId/request-payment', require('../controllers/salesController').requestInstallmentPayment);

// Demo Requests
router.get('/demo-requests', require('../controllers/salesController').getDemoRequests);
router.patch('/demo-requests/:leadId/status', require('../controllers/salesController').updateDemoRequestStatus);

// Sales Tasks
router.get('/tasks', require('../controllers/salesController').listSalesTasks);
router.post('/tasks', require('../controllers/salesController').createSalesTask);
router.put('/tasks/:id', require('../controllers/salesController').updateSalesTask);
router.patch('/tasks/:id/toggle', require('../controllers/salesController').toggleSalesTask);
router.delete('/tasks/:id', require('../controllers/salesController').deleteSalesTask);

// Sales Meetings
router.get('/meetings', require('../controllers/salesController').listSalesMeetings);
router.post('/meetings', require('../controllers/salesController').createSalesMeeting);
router.put('/meetings/:id', require('../controllers/salesController').updateSalesMeeting);
router.delete('/meetings/:id', require('../controllers/salesController').deleteSalesMeeting);
router.get('/clients/my-converted', require('../controllers/salesController').getMyConvertedClients);

// Client Profile Management
router.get('/clients/:id/profile', require('../controllers/salesController').getClientProfile);
router.post('/clients/:clientId/payments', require('../controllers/salesController').createClientPayment);
router.post('/clients/:clientId/project-requests', require('../controllers/salesController').createProjectRequest);
router.get('/clients/:clientId/project-requests', require('../controllers/salesController').getProjectRequests);
router.post('/clients/:clientId/increase-cost', require('../controllers/salesController').increaseProjectCost);
router.post('/clients/:clientId/transfer', require('../controllers/salesController').transferClient);
router.post('/clients/:clientId/mark-completed', require('../controllers/salesController').markProjectCompleted);
router.get('/clients/:clientId/transactions', require('../controllers/salesController').getClientTransactions);

// Wallet
router.get('/wallet/summary', getWalletSummary);

// Notices
router.get('/notices', getPublishedNoticesForSales);
router.post('/notices/:id/view', incrementNoticeViews);

module.exports = router;
