const Employee = require('../models/Employee');
const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get employee dashboard statistics
// @route   GET /api/employee/analytics/dashboard
// @access  Private (Employee)
const getEmployeeDashboardStats = asyncHandler(async (req, res) => {
  const employeeId = req.employee?.id || req.user?.id;
  
  if (!employeeId) {
    return res.status(401).json({
      success: false,
      message: 'Employee ID not found'
    });
  }

  // Get employee's assigned tasks (assignedTo is an array)
  const tasks = await Task.find({ assignedTo: { $in: [employeeId] } });
  
  // Get projects where employee is in assignedTeam
  const teamProjects = await Project.find({ assignedTeam: { $in: [employeeId] } }).select('_id');
  const teamProjectIds = teamProjects.map(p => p._id);
  
  // Get projects where employee has tasks assigned (since every task belongs to a project)
  const tasksWithProjects = await Task.find({ assignedTo: { $in: [employeeId] } }).select('project').distinct('project');
  const taskProjectIds = tasksWithProjects.filter(Boolean);
  
  // Combine and deduplicate project IDs
  const allProjectIds = [...new Set([...teamProjectIds.map(id => id.toString()), ...taskProjectIds.map(id => id.toString())])];
  
  // Get all assigned projects (from team or tasks)
  const projects = await Project.find({ _id: { $in: allProjectIds } });

  // Calculate task statistics
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    urgent: tasks.filter(t => 
      (t.isUrgent || t.priority === 'urgent' || t.priority === 'high') && 
      t.status !== 'completed'
    ).length,
    overdue: tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== 'completed'
    ).length,
    dueSoon: tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate <= threeDaysFromNow && dueDate > now;
    }).length
  };

  // Calculate project statistics
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length
  };

  // Get employee points and statistics
  const employee = await Employee.findById(employeeId);
  const points = {
    current: employee.points || 0,
    rank: await getEmployeeRank(employeeId),
    totalEmployees: await Employee.countDocuments({ role: 'employee' }),
    tasksCompleted: employee.statistics?.tasksCompleted || 0,
    tasksOnTime: employee.statistics?.tasksOnTime || 0,
    tasksOverdue: employee.statistics?.tasksOverdue || 0
  };

  // Get recent points history
  const recentPointsHistory = employee.pointsHistory?.slice(-5).reverse() || [];

  res.json({
    success: true,
    data: {
      tasks: taskStats,
      projects: projectStats,
      points,
      recentPointsHistory
    }
  });
});

// @desc    Get employee performance statistics
// @route   GET /api/employee/analytics/performance
// @access  Private (Employee)
const getEmployeePerformanceStats = asyncHandler(async (req, res) => {
  const employeeId = req.employee?.id || req.user?.id;
  
  if (!employeeId) {
    return res.status(401).json({
      success: false,
      message: 'Employee ID not found'
    });
  }
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  // Get detailed performance metrics
  const performanceStats = {
    points: employee.points || 0,
    rank: await getEmployeeRank(employeeId),
    statistics: employee.statistics || {
      tasksCompleted: 0,
      tasksOnTime: 0,
      tasksOverdue: 0,
      tasksMissed: 0,
      averageCompletionTime: 0,
      completionRate: 0,
      totalPointsEarned: 0,
      totalPointsDeducted: 0
    },
    pointsHistory: employee.pointsHistory || [],
    achievements: employee.achievements || []
  };

  res.json({
    success: true,
    data: performanceStats
  });
});

// @desc    Get employee leaderboard
// @route   GET /api/employee/analytics/leaderboard
// @access  Private (Employee)
const getEmployeeLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, period = 'month' } = req.query;
  const employeeId = req.employee?.id || req.user?.id;
  
  if (!employeeId) {
    return res.status(401).json({
      success: false,
      message: 'Employee ID not found'
    });
  }

  // Calculate date range based on period
  const dateRange = getDateRange(period);
  
  // Get all employees with their statistics
  const employees = await Employee.find({ role: 'employee' })
    .select('name email points statistics department position pointsHistory')
    .sort({ points: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Transform data for leaderboard
  const leaderboard = employees.map((emp, index) => ({
    _id: emp._id,
    name: emp.name,
    points: emp.points || 0,
    rank: index + 1,
      statistics: {
        tasksCompleted: emp.statistics?.tasksCompleted || 0,
        tasksOnTime: emp.statistics?.tasksOnTime || 0,
        tasksOverdue: emp.statistics?.tasksOverdue || 0,
        tasksMissed: emp.statistics?.tasksMissed || 0,
        averageCompletionTime: emp.statistics?.averageCompletionTime || 0,
        completionRate: emp.statistics?.completionRate || 0
      },
    department: emp.department || 'Development',
    position: emp.position || 'Developer',
    isCurrentEmployee: emp._id.toString() === employeeId.toString(),
    trend: calculateTrend(emp.pointsHistory, period),
    trendValue: calculateTrendValue(emp.pointsHistory, period),
    lastActive: emp.updatedAt
  }));

  // Get current employee data
  const currentEmployee = leaderboard.find(emp => emp.isCurrentEmployee);

  // Get team statistics
  const teamStats = {
    totalEmployees: employees.length,
    avgCompletionRate: Math.round(
      employees.reduce((sum, emp) => sum + (emp.statistics?.completionRate || 0), 0) / employees.length
    ),
    totalTasksCompleted: employees.reduce((sum, emp) => sum + (emp.statistics?.tasksCompleted || 0), 0),
    totalOverdue: employees.reduce((sum, emp) => sum + (emp.statistics?.tasksOverdue || 0), 0),
    topPerformer: leaderboard[0] || null,
    avgProjectProgress: 0, // This would need project data
    totalProjects: 0 // This would need project data
  };

  res.json({
    success: true,
    data: {
      leaderboard,
      currentEmployee,
      teamStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(await Employee.countDocuments({ role: 'employee' }) / limit),
        total: await Employee.countDocuments({ role: 'employee' })
      }
    }
  });
});

// @desc    Get employee points history
// @route   GET /api/employee/analytics/points-history
// @access  Private (Employee)
const getEmployeePointsHistory = asyncHandler(async (req, res) => {
  const employeeId = req.employee?.id || req.user?.id;
  
  if (!employeeId) {
    return res.status(401).json({
      success: false,
      message: 'Employee ID not found'
    });
  }
  const { page = 1, limit = 20 } = req.query;

  const employee = await Employee.findById(employeeId)
    .populate('pointsHistory.taskId', 'title dueDate status');

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  const pointsHistory = employee.pointsHistory || [];
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedHistory = pointsHistory.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      pointsHistory: paginatedHistory,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(pointsHistory.length / limit),
        total: pointsHistory.length
      }
    }
  });
});

// Helper function to get employee rank
const getEmployeeRank = async (employeeId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) return 1;

  const higherScoredEmployees = await Employee.countDocuments({
    role: 'employee',
    points: { $gt: employee.points || 0 }
  });

  return higherScoredEmployees + 1;
};

// Helper function to calculate date range
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return { start, end: now };
};

// Helper function to calculate trend
const calculateTrend = (pointsHistory, period) => {
  if (!pointsHistory || pointsHistory.length < 2) return 'stable';

  const dateRange = getDateRange(period);
  const recentPoints = pointsHistory
    .filter(entry => entry.timestamp >= dateRange.start)
    .reduce((sum, entry) => sum + entry.points, 0);

  const previousPoints = pointsHistory
    .filter(entry => entry.timestamp < dateRange.start)
    .reduce((sum, entry) => sum + entry.points, 0);

  if (recentPoints > previousPoints) return 'up';
  if (recentPoints < previousPoints) return 'down';
  return 'stable';
};

// Helper function to calculate trend value
const calculateTrendValue = (pointsHistory, period) => {
  if (!pointsHistory || pointsHistory.length < 2) return '0%';

  const dateRange = getDateRange(period);
  const recentPoints = pointsHistory
    .filter(entry => entry.timestamp >= dateRange.start)
    .reduce((sum, entry) => sum + entry.points, 0);

  const previousPoints = pointsHistory
    .filter(entry => entry.timestamp < dateRange.start)
    .reduce((sum, entry) => sum + entry.points, 0);

  if (previousPoints === 0) return recentPoints > 0 ? '+100%' : '0%';

  const percentage = Math.round(((recentPoints - previousPoints) / Math.abs(previousPoints)) * 100);
  return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
};

module.exports = {
  getEmployeeDashboardStats,
  getEmployeePerformanceStats,
  getEmployeeLeaderboard,
  getEmployeePointsHistory
};