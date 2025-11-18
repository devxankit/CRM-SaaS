const express = require('express');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectCost,
  addProjectInstallments,
  updateProjectInstallment,
  deleteProjectInstallment,
  deleteProject,
  getProjectStatistics,
  getProjectManagementStatistics,
  getPendingProjects,
  assignPMToPendingProject,
  getPMsForAssignment
} = require('../controllers/adminProjectController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// Admin project routes
router.get('/', getAllProjects);
router.get('/statistics', getProjectStatistics);
router.get('/management-statistics', getProjectManagementStatistics);
router.get('/pending', getPendingProjects);
router.get('/pms-for-assignment', getPMsForAssignment);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.post('/pending/:id/assign-pm', assignPMToPendingProject);
router.put('/:id', updateProject);
router.put('/:id/cost', updateProjectCost);
router.post('/:id/installments', addProjectInstallments);
router.put('/:id/installments/:installmentId', updateProjectInstallment);
router.delete('/:id/installments/:installmentId', deleteProjectInstallment);
router.delete('/:id', deleteProject);

module.exports = router;
