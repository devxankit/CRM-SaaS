const Task = require('../models/Task');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Activity = require('../models/Activity');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const socketService = require('../services/socketService');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new task
// @route   POST /api/tasks
// @access  PM only
const createTask = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    project,
    milestone,
    assignedTo,
    priority,
    dueDate,
    estimatedHours
  } = req.body;

  // Verify project exists and user is the project manager
  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    return next(new ErrorResponse('Project not found', 404));
  }

  if (!projectDoc.projectManager.equals(req.user.id)) {
    return next(new ErrorResponse('Not authorized to create tasks for this project', 403));
  }

  // Verify milestone exists and belongs to project
  const milestoneDoc = await Milestone.findById(milestone);
  if (!milestoneDoc) {
    return next(new ErrorResponse('Milestone not found', 404));
  }

  if (!milestoneDoc.project.equals(project)) {
    return next(new ErrorResponse('Milestone does not belong to the specified project', 400));
  }

  // Create task
  const task = await Task.create({
    title,
    description,
    project,
    milestone,
    assignedTo,
    priority,
    dueDate,
    estimatedHours,
    createdBy: req.user.id
  });

  // Add task to milestone
  await milestoneDoc.addTask(task._id);

  // Populate the task with related data
  await task.populate([
    { path: 'project', select: 'name status' },
    { path: 'milestone', select: 'title sequence' },
    { path: 'assignedTo', select: 'name email position' },
    { path: 'createdBy', select: 'name email' }
  ]);

  // Log activity
  await Activity.logTaskActivity(
    task._id,
    'created',
    req.user.id,
    'PM',
    `Task "${task.title}" was created in milestone "${milestoneDoc.title}"`,
    { taskTitle: task.title, milestoneTitle: milestoneDoc.title }
  );

  // Emit WebSocket events
  socketService.emitToProject(project, 'task_created', {
    task: task,
    createdBy: req.user.name,
    timestamp: new Date()
  });

  // Notify assigned employees
  task.assignedTo.forEach(employee => {
    socketService.emitToUser(employee._id, 'task_assigned', {
      task: task,
      message: `New task "${task.title}" has been assigned to you`
    });
  });

  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Create urgent task
// @route   POST /api/tasks/urgent
// @access  PM only
const createUrgentTask = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    project,
    milestone,
    assignedTo,
    dueDate,
    estimatedHours
  } = req.body;

  // Verify project exists and user is the project manager
  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    return next(new ErrorResponse('Project not found', 404));
  }

  if (!projectDoc.projectManager.equals(req.user.id)) {
    return next(new ErrorResponse('Not authorized to create tasks for this project', 403));
  }

  // Verify milestone exists and belongs to project
  const milestoneDoc = await Milestone.findById(milestone);
  if (!milestoneDoc) {
    return next(new ErrorResponse('Milestone not found', 404));
  }

  if (!milestoneDoc.project.equals(project)) {
    return next(new ErrorResponse('Milestone does not belong to the specified project', 400));
  }

  // Create urgent task
  const task = await Task.create({
    title,
    description,
    project,
    milestone,
    assignedTo,
    priority: 'urgent',
    isUrgent: true,
    dueDate,
    estimatedHours,
    createdBy: req.user.id
  });

  // Add task to milestone
  await milestoneDoc.addTask(task._id);

  // Populate the task with related data
  await task.populate([
    { path: 'project', select: 'name status' },
    { path: 'milestone', select: 'title sequence' },
    { path: 'assignedTo', select: 'name email position' },
    { path: 'createdBy', select: 'name email' }
  ]);

  // Log activity
  await Activity.logTaskActivity(
    task._id,
    'created',
    req.user.id,
    'PM',
    `Urgent task "${task.title}" was created in milestone "${milestoneDoc.title}"`,
    { taskTitle: task.title, milestoneTitle: milestoneDoc.title, isUrgent: true }
  );

  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Get tasks by milestone
// @route   GET /api/tasks/milestone/:milestoneId
// @access  PM, Employee (if assigned), Client (if their project)
const getTasksByMilestone = asyncHandler(async (req, res, next) => {
  const { milestoneId } = req.params;

  // Verify milestone exists and user has access
  const milestone = await Milestone.findById(milestoneId).populate('project');
  if (!milestone) {
    return next(new ErrorResponse('Milestone not found', 404));
  }

  // Check access permissions
  const project = milestone.project;
  if (req.user.role === 'client' && !project.client.equals(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this milestone', 403));
  }

  if (req.user.role === 'employee' && !project.assignedTeam.some(member => member.equals(req.user.id))) {
    return next(new ErrorResponse('Not authorized to access this milestone', 403));
  }

  const tasks = await Task.find({ milestone: milestoneId })
    .populate('project', 'name status')
    .populate('milestone', 'title sequence')
    .populate('assignedTo', 'name email position')
    .populate('createdBy', 'name email')
    .sort({ isUrgent: -1, priority: -1, dueDate: 1 });

  res.json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get tasks by project
// @route   GET /api/tasks/project/:projectId
// @access  PM, Employee (if assigned), Client (if their project)
const getTasksByProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  // Verify project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  // Check access permissions
  if (req.user.role === 'client' && !project.client.equals(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this project', 403));
  }

  if (req.user.role === 'employee' && !project.assignedTeam.some(member => member.equals(req.user.id))) {
    return next(new ErrorResponse('Not authorized to access this project', 403));
  }

  const tasks = await Task.find({ project: projectId })
    .populate('project', 'name status')
    .populate('milestone', 'title sequence')
    .populate('assignedTo', 'name email position')
    .populate('createdBy', 'name email')
    .sort({ isUrgent: -1, priority: -1, dueDate: 1 });

  res.json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get all tasks for authenticated PM
// @route   GET /api/tasks
// @access  PM only
const getAllTasks = asyncHandler(async (req, res, next) => {
  const {
    status,
    priority,
    project,
    page = 1,
    limit = 100,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object - only tasks from PM's projects
  const filter = {};
  
  // Get all projects managed by this PM
  const pmProjects = await Project.find({ projectManager: req.user.id }).select('_id');
  const projectIds = pmProjects.map(p => p._id);
  
  // Filter tasks by PM's projects
  filter.project = { $in: projectIds };
  
  // Apply additional filters
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const tasks = await Task.find(filter)
    .populate('project', 'name status')
    .populate('milestone', 'title sequence')
    .populate('assignedTo', 'name email position')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(filter);

  res.json({
    success: true,
    count: tasks.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: tasks
  });
});

// @desc    Get tasks by employee
// @route   GET /api/tasks/employee/:employeeId
// @access  Employee (own tasks only), PM
const getTasksByEmployee = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;

  // Check access permissions
  if (req.user.role === 'employee' && req.user.id !== employeeId) {
    return next(new ErrorResponse('Not authorized to access these tasks', 403));
  }

  const tasks = await Task.find({ assignedTo: employeeId })
    .populate('project', 'name status')
    .populate('milestone', 'title sequence')
    .populate('assignedTo', 'name email position')
    .populate('createdBy', 'name email')
    .sort({ isUrgent: -1, priority: -1, dueDate: 1 });

  res.json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get urgent tasks
// @route   GET /api/tasks/urgent
// @access  PM only
const getUrgentTasks = asyncHandler(async (req, res, next) => {
  const filter = { isUrgent: true };

  // If PM, only show urgent tasks from their projects
  if (req.user.role === 'project-manager') {
    const pmProjects = await Project.find({ projectManager: req.user.id }).select('_id');
    filter.project = { $in: pmProjects.map(p => p._id) };
  }

  const tasks = await Task.find(filter)
    .populate('project', 'name status')
    .populate('milestone', 'title sequence')
    .populate('assignedTo', 'name email position')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 });

  res.json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  PM, Employee (if assigned), Client (if their project)
const getTaskById = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('project', 'name status client projectManager assignedTeam')
    .populate('milestone', 'title sequence')
    .populate('assignedTo', 'name email position department')
    .populate('createdBy', 'name email')
    .populate('comments.user', 'name email');

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Check access permissions
  const project = task.project;
  if (req.user.role === 'client' && !project.client.equals(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this task', 403));
  }

  if (req.user.role === 'employee' && !project.assignedTeam.some(member => member.equals(req.user.id))) {
    return next(new ErrorResponse('Not authorized to access this task', 403));
  }

  res.json({
    success: true,
    data: task
  });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  PM only
const updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Verify user is the project manager
  const project = await Project.findById(task.project);
  if (!project.projectManager.equals(req.user.id)) {
    return next(new ErrorResponse('Not authorized to update this task', 403));
  }

  const {
    title,
    description,
    assignedTo,
    priority,
    dueDate,
    estimatedHours
  } = req.body;

  // Update task
  task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      estimatedHours
    },
    { new: true, runValidators: true }
  ).populate([
    { path: 'project', select: 'name status' },
    { path: 'milestone', select: 'title sequence' },
    { path: 'assignedTo', select: 'name email position' },
    { path: 'createdBy', select: 'name email' }
  ]);

  // Log activity
  await Activity.logTaskActivity(
    task._id,
    'updated',
    req.user.id,
    'PM',
    `Task "${task.title}" was updated`,
    { taskTitle: task.title }
  );

  res.json({
    success: true,
    data: task
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  PM only
const deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Verify user is the project manager
  const project = await Project.findById(task.project);
  if (!project.projectManager.equals(req.user.id)) {
    return next(new ErrorResponse('Not authorized to delete this task', 403));
  }

  // Remove task from milestone
  const milestone = await Milestone.findById(task.milestone);
  if (milestone) {
    await milestone.removeTask(task._id);
  }

  // Delete task
  await Task.findByIdAndDelete(req.params.id);

  // Log activity
  await Activity.logTaskActivity(
    task._id,
    'deleted',
    req.user.id,
    'PM',
    `Task "${task.title}" was deleted from milestone "${milestone.title}"`,
    { taskTitle: task.title, milestoneTitle: milestone.title }
  );

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  PM, Employee (if assigned)
const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Check permissions
  const project = await Project.findById(task.project);
  const isPM = project.projectManager.equals(req.user.id);
  const isAssignedEmployee = task.assignedTo.some(employee => employee.equals(req.user.id));

  if (!isPM && !isAssignedEmployee) {
    return next(new ErrorResponse('Not authorized to update this task', 403));
  }

  // Update status
  await task.updateStatus(status);

  // Populate task data
  await task.populate([
    { path: 'project', select: 'name status' },
    { path: 'milestone', select: 'title sequence' },
    { path: 'assignedTo', select: 'name email position' },
    { path: 'createdBy', select: 'name email' }
  ]);

  // Log activity
  const userModel = isPM ? 'PM' : 'Employee';
  await Activity.logTaskActivity(
    task._id,
    'status_changed',
    req.user.id,
    userModel,
    `Task "${task.title}" status changed to ${status}`,
    { taskTitle: task.title, status }
  );

  // Emit WebSocket events
  socketService.emitToProject(task.project._id, 'task_status_updated', {
    task: task,
    status: status,
    updatedBy: req.user.name,
    timestamp: new Date()
  });

  // Notify PM if employee updated status
  if (!isPM) {
    const project = await Project.findById(task.project._id);
    socketService.emitToUser(project.projectManager, 'task_status_updated', {
      task: task,
      status: status,
      updatedBy: req.user.name,
      message: `Task "${task.title}" status updated to ${status} by ${req.user.name}`
    });
  }

  // Notify other assigned employees
  task.assignedTo.forEach(employee => {
    if (!employee._id.equals(req.user.id)) {
      socketService.emitToUser(employee._id, 'task_status_updated', {
        task: task,
        status: status,
        updatedBy: req.user.name,
        message: `Task "${task.title}" status updated to ${status}`
      });
    }
  });

  res.json({
    success: true,
    data: task
  });
});

// @desc    Assign/reassign task
// @route   PATCH /api/tasks/:id/assign
// @access  PM only
const assignTask = asyncHandler(async (req, res, next) => {
  const { assignedTo } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Verify user is the project manager
  const project = await Project.findById(task.project);
  if (!project.projectManager.equals(req.user.id)) {
    return next(new ErrorResponse('Not authorized to assign this task', 403));
  }

  // Update assignment
  await task.assignTo(assignedTo);

  // Populate task data
  await task.populate([
    { path: 'project', select: 'name status' },
    { path: 'milestone', select: 'title sequence' },
    { path: 'assignedTo', select: 'name email position' },
    { path: 'createdBy', select: 'name email' }
  ]);

  // Log activity
  await Activity.logTaskActivity(
    task._id,
    'assigned',
    req.user.id,
    'PM',
    `Task "${task.title}" was assigned to team members`,
    { taskTitle: task.title, assignedTo }
  );

  res.json({
    success: true,
    data: task
  });
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  PM, Employee (if assigned), Client (if their project)
const addTaskComment = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Check access permissions
  const project = await Project.findById(task.project);
  const isPM = project.projectManager.equals(req.user.id);
  const isAssignedEmployee = task.assignedTo.some(employee => employee.equals(req.user.id));
  const isClient = project.client.equals(req.user.id);

  if (!isPM && !isAssignedEmployee && !isClient) {
    return next(new ErrorResponse('Not authorized to comment on this task', 403));
  }

  // Add comment
  const userModel = isPM ? 'PM' : isAssignedEmployee ? 'Employee' : 'Client';
  await task.addComment(req.user.id, userModel, message);

  // Populate task data
  await task.populate([
    { path: 'project', select: 'name status' },
    { path: 'milestone', select: 'title sequence' },
    { path: 'assignedTo', select: 'name email position' },
    { path: 'createdBy', select: 'name email' },
    { path: 'comments.user', select: 'name email' }
  ]);

  // Log activity
  await Activity.logTaskActivity(
    task._id,
    'commented',
    req.user.id,
    userModel,
    `Comment added to task "${task.title}"`,
    { taskTitle: task.title }
  );

  res.json({
    success: true,
    data: task
  });
});

// @desc    Upload task attachment
// @route   POST /api/tasks/:id/attachments
// @access  PM, Employee (if assigned)
const uploadTaskAttachment = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Check permissions
  const project = await Project.findById(task.project);
  const isPM = project.projectManager.equals(req.user.id);
  const isAssignedEmployee = task.assignedTo.some(employee => employee.equals(req.user.id));

  if (!isPM && !isAssignedEmployee) {
    return next(new ErrorResponse('Not authorized to upload attachments', 403));
  }

  if (!req.file) {
    return next(new ErrorResponse('No file uploaded', 400));
  }

  try {
    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'tasks');

    // Add attachment to task
    await task.addAttachment(result);

    // Log activity
    const userModel = isPM ? 'PM' : 'Employee';
    await Activity.logTaskActivity(
      task._id,
      'attachment_added',
      req.user.id,
      userModel,
      `Attachment "${result.originalName}" was added to task "${task.title}"`,
      { fileName: result.originalName, taskTitle: task.title }
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return next(new ErrorResponse('Failed to upload attachment', 500));
  }
});

// @desc    Remove task attachment
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  PM, Employee (if assigned)
const removeTaskAttachment = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Check permissions
  const project = await Project.findById(task.project);
  const isPM = project.projectManager.equals(req.user.id);
  const isAssignedEmployee = task.assignedTo.some(employee => employee.equals(req.user.id));

  if (!isPM && !isAssignedEmployee) {
    return next(new ErrorResponse('Not authorized to remove attachments', 403));
  }

  const attachment = task.attachments.id(req.params.attachmentId);

  if (!attachment) {
    return next(new ErrorResponse('Attachment not found', 404));
  }

  try {
    // Delete from Cloudinary
    await deleteFromCloudinary(attachment.public_id);

    // Remove attachment from task
    await task.removeAttachment(req.params.attachmentId);

    // Log activity
    const userModel = isPM ? 'PM' : 'Employee';
    await Activity.logTaskActivity(
      task._id,
      'attachment_removed',
      req.user.id,
      userModel,
      `Attachment "${attachment.originalName}" was removed from task "${task.title}"`,
      { fileName: attachment.originalName, taskTitle: task.title }
    );

    res.json({
      success: true,
      message: 'Attachment removed successfully'
    });
  } catch (error) {
    return next(new ErrorResponse('Failed to remove attachment', 500));
  }
});

module.exports = {
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
};
