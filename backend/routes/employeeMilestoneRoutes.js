const express = require('express');
const router = express.Router();
const {
  getEmployeeMilestoneById,
  getEmployeeMilestoneTasks,
  addEmployeeMilestoneComment
} = require('../controllers/employeeMilestoneController');
const { protect, authorize } = require('../middlewares/auth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('employee'));

// Get milestone details
router.get('/:id', getEmployeeMilestoneById);

// Get milestone tasks (filtered to employee's tasks)
router.get('/:id/tasks', getEmployeeMilestoneTasks);

// Add comment to milestone
router.post('/:id/comments', addEmployeeMilestoneComment);

module.exports = router;
