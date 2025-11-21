const express = require('express');
const {
  loginMasterAdmin,
  getMasterAdminProfile,
  updateMasterAdminProfile,
  logoutMasterAdmin
} = require('../controllers/masterAdminController');
const { protect, isMasterAdmin } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/login', loginMasterAdmin);

// Protected routes
router.use(protect); // All routes below this middleware are protected
router.use(isMasterAdmin); // All routes below require master-admin role

router.get('/profile', getMasterAdminProfile);
router.put('/profile', updateMasterAdminProfile);
router.post('/logout', logoutMasterAdmin);

module.exports = router;


