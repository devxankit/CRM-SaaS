const express = require('express');
const {
  createTask,
  createUrgentTask,
  getAllTasks,
  getTasksByMilestone,
  getTasksByProject,
  getTasksByEmployee,
  getUrgentTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
  addTaskComment,
  uploadTaskAttachment,
  removeTaskAttachment
} = require('../controllers/taskController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(authorize('project-manager')); // PM-only routes

// Task CRUD routes
router.post('/', createTask);
router.post('/urgent', createUrgentTask);
router.get('/', getAllTasks);
router.get('/milestone/:milestoneId', getTasksByMilestone);
router.get('/project/:projectId', getTasksByProject);
router.get('/employee/:employeeId', getTasksByEmployee);
router.get('/urgent', getUrgentTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Task action routes
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/assign', assignTask);
router.post('/:id/comments', addTaskComment);

// Task attachment routes
router.post('/:id/attachments', upload.single('attachment'), uploadTaskAttachment);
router.delete('/:id/attachments/:attachmentId', removeTaskAttachment);

module.exports = router;
