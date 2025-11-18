const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStatistics
} = require('../controllers/adminUserController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { uploadAttendance, getAttendance } = require('../controllers/adminAttendanceController');
const {
  setEmployeeSalary,
  getSalaryRecords,
  getSalaryRecord,
  updateSalaryRecord,
  generateMonthlySalaries,
  getEmployeeSalaryHistory,
  deleteSalaryRecord,
  updateIncentivePayment,
  updateRewardPayment
} = require('../controllers/adminSalaryController');
const {
  createAllowance,
  getAllAllowances,
  getAllowanceById,
  updateAllowance,
  deleteAllowance,
  getAllowanceStatistics
} = require('../controllers/adminAllowanceController');
const {
  createRecurringExpense,
  getAllRecurringExpenses,
  getRecurringExpenseById,
  updateRecurringExpense,
  deleteRecurringExpense,
  generateExpenseEntries,
  getExpenseEntries,
  markEntryAsPaid
} = require('../controllers/adminRecurringExpenseController');

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('admin', 'hr'));

// @route   GET /api/admin/users/statistics
// @desc    Get user statistics
// @access  Private (Admin/HR only)
router.get('/statistics', getUserStatistics);

// IMPORTANT: All specific routes (attendance, salary) must come BEFORE generic routes (/:userType/:id)
// Otherwise, Express will match /salary/:id as /:userType/:id where userType="salary"

// Attendance (Admin/HR) - Must come before generic routes
router.post('/attendance/upload', upload.single('file'), uploadAttendance);
router.get('/attendance', getAttendance);

// Salary Management (Admin/HR) - Must come before generic routes
router.post('/salary/generate/:month', generateMonthlySalaries);
router.get('/salary/generate/:month', generateMonthlySalaries);
router.get('/salary/employee/:userType/:employeeId', getEmployeeSalaryHistory);
router.put('/salary/set/:userType/:employeeId', setEmployeeSalary);
router.put('/salary/:id/incentive', updateIncentivePayment);
router.put('/salary/:id/reward', updateRewardPayment);
router.get('/salary/:id', getSalaryRecord);
router.put('/salary/:id', updateSalaryRecord);
router.delete('/salary/:id', deleteSalaryRecord);
router.get('/salary', getSalaryRecords);

// Allowances Management (Admin/HR) - Must come before generic routes
router.get('/allowances/statistics', getAllowanceStatistics);
router.post('/allowances', createAllowance);
router.get('/allowances/:id', getAllowanceById);
router.put('/allowances/:id', updateAllowance);
router.delete('/allowances/:id', deleteAllowance);
router.get('/allowances', getAllAllowances);

// Recurring Expenses Management (Admin/HR) - Must come before generic routes
router.get('/recurring-expenses/entries', getExpenseEntries);
router.post('/recurring-expenses/:id/generate-entries', generateExpenseEntries);
router.put('/recurring-expenses/entries/:id/pay', markEntryAsPaid);
router.post('/recurring-expenses', createRecurringExpense);
router.get('/recurring-expenses/:id', getRecurringExpenseById);
router.put('/recurring-expenses/:id', updateRecurringExpense);
router.delete('/recurring-expenses/:id', deleteRecurringExpense);
router.get('/recurring-expenses', getAllRecurringExpenses);

// Generic user routes (must come after all specific routes)
// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin/HR only)
router.get('/', getAllUsers);

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private (Admin/HR only)
router.post('/', createUser);

// @route   GET /api/admin/users/:userType/:id
// @desc    Get single user by ID and type
// @access  Private (Admin/HR only)
router.get('/:userType/:id', getUser);

// @route   PUT /api/admin/users/:userType/:id
// @desc    Update user
// @access  Private (Admin/HR only)
router.put('/:userType/:id', updateUser);

// @route   DELETE /api/admin/users/:userType/:id
// @desc    Delete user
// @access  Private (Admin/HR only)
router.delete('/:userType/:id', deleteUser);

module.exports = router;
