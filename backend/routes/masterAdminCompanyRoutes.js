const express = require('express');
const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyStatistics,
  suspendCompany,
  activateCompany
} = require('../controllers/masterAdminCompanyController');
const { protect, isMasterAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require master-admin authentication
router.use(protect);
router.use(isMasterAdmin);

router.post('/', createCompany);
router.get('/statistics', getCompanyStatistics);
router.get('/:id', getCompanyById);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);
router.patch('/:id/suspend', suspendCompany);
router.patch('/:id/activate', activateCompany);
router.get('/', getAllCompanies); // This should be last to avoid matching /statistics

module.exports = router;


