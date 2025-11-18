const express = require('express');
const {
  getEmployeeProjects,
  getEmployeeProjectById,
  getEmployeeProjectMilestones,
  getEmployeeProjectStatistics
} = require('../controllers/employeeProjectController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected and employee-only
router.use(protect);
router.use(authorize('employee'));

// Employee project routes
router.get('/', getEmployeeProjects);
router.get('/statistics', getEmployeeProjectStatistics);
router.get('/:id', getEmployeeProjectById);
router.get('/:id/milestones', getEmployeeProjectMilestones);

module.exports = router;
