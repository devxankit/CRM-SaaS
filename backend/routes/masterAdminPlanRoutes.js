const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/masterAdminPlanController');
const { protect, isMasterAdmin } = require('../middlewares/auth');

// All routes require master-admin authentication
router.use(protect);
router.use(isMasterAdmin);

router.get('/', getAllPlans);
router.get('/:id', getPlanById);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;

