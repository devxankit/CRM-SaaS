const express = require('express');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByClient,
  getProjectsByPM,
  getProjectStatistics,
  uploadProjectAttachment,
  removeProjectAttachment,
  updateProjectRevisionStatus,
  getProjectTeamMembers
} = require('../controllers/projectController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(authorize('project-manager')); // PM-only routes

// Project CRUD routes
router.post('/', createProject);
router.get('/', getAllProjects);
router.get('/statistics', getProjectStatistics);
router.get('/client/:clientId', getProjectsByClient);
router.get('/pm/:pmId', getProjectsByPM);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Project attachment routes
router.post('/:id/attachments', upload.single('attachment'), uploadProjectAttachment);
router.delete('/:id/attachments/:attachmentId', removeProjectAttachment);

// Project revision routes
router.patch('/:id/revisions/:revisionType', updateProjectRevisionStatus);

// Project team routes
router.get('/:id/team', getProjectTeamMembers);

module.exports = router;
