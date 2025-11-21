const express = require('express');
const {
  getAllUsers,
  getUserById,
  getUserStatistics,
  getUsersByCompany,
  deactivateUser,
  activateUser
} = require('../controllers/masterAdminUserController');
const { protect, isMasterAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require master-admin authentication
router.use(protect);
router.use(isMasterAdmin);

router.get('/statistics', getUserStatistics);
router.get('/company/:companyId', getUsersByCompany);
router.patch('/:userType/:id/deactivate', deactivateUser);
router.patch('/:userType/:id/activate', activateUser);
router.get('/:userType/:id', getUserById);
router.get('/', getAllUsers); // This should be last to avoid matching other routes

module.exports = router;

