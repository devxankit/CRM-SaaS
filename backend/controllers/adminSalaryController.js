const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const Sales = require('../models/Sales');
const PM = require('../models/PM');
const Incentive = require('../models/Incentive');
const mongoose = require('mongoose');
const asyncHandler = require('../middlewares/asyncHandler');

// Helper: Get employee by ID and model type
const getEmployee = async (employeeId, employeeModel) => {
  let Model;
  switch (employeeModel) {
    case 'Employee':
      Model = Employee;
      break;
    case 'Sales':
      Model = Sales;
      break;
    case 'PM':
      Model = PM;
      break;
    default:
      return null;
  }
  return await Model.findById(employeeId);
};

// Helper: Calculate payment date based on joining date for a given month
const calculatePaymentDate = (joiningDate, month) => {
  const [year, monthNum] = month.split('-');
  const joiningDay = new Date(joiningDate).getDate();
  const lastDayOfMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
  const paymentDay = Math.min(joiningDay, lastDayOfMonth);
  return new Date(parseInt(year), parseInt(monthNum) - 1, paymentDay);
};

// Helper: Get employee model type from user type
const getEmployeeModelType = (userType) => {
  switch (userType) {
    case 'employee':
      return 'Employee';
    case 'sales':
      return 'Sales';
    case 'project-manager':
    case 'pm':
      return 'PM';
    default:
      return null;
  }
};

// @desc    Set employee fixed salary
// @route   PUT /api/admin/salary/set/:userType/:employeeId
// @access  Private (Admin/HR)
exports.setEmployeeSalary = asyncHandler(async (req, res) => {
  const { userType, employeeId } = req.params;
  const { fixedSalary } = req.body;

  if (!fixedSalary || fixedSalary < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid fixed salary amount is required'
    });
  }

  const employeeModel = getEmployeeModelType(userType);
  if (!employeeModel) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user type'
    });
  }

  const employee = await getEmployee(employeeId, employeeModel);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }

  // Update fixed salary
  employee.fixedSalary = fixedSalary;
  await employee.save();

  // Auto-generate salary records for current and next 3 months
  const currentDate = new Date();
  const months = [];
  for (let i = 0; i < 4; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  const joiningDate = employee.joiningDate;
  const paymentDay = new Date(joiningDate).getDate();

  for (const month of months) {
    const paymentDate = calculatePaymentDate(joiningDate, month);
    
    // Calculate incentiveAmount for sales team
    let incentiveAmount = 0;
    if (employeeModel === 'Sales') {
      try {
        const incentives = await Incentive.find({
          salesEmployee: employee._id,
          currentBalance: { $gt: 0 }
        });
        incentiveAmount = incentives.reduce((sum, inc) => sum + (inc.currentBalance || 0), 0);
      } catch (error) {
        console.error(`Error calculating incentive for employee ${employee._id}:`, error);
      }
    }

    await Salary.findOneAndUpdate(
      {
        employeeId: employee._id,
        employeeModel,
        month
      },
      {
        employeeId: employee._id,
        employeeModel,
        employeeName: employee.name,
        department: employee.department || 'unknown',
        role: employee.role || userType,
        month,
        fixedSalary,
        paymentDate,
        paymentDay,
        status: 'pending',
        incentiveAmount,
        incentiveStatus: 'pending',
        rewardAmount: 0,
        rewardStatus: 'pending',
        createdBy: req.admin.id
      },
      {
        upsert: true,
        new: true
      }
    );
  }

  res.json({
    success: true,
    message: `Fixed salary set to ₹${fixedSalary.toLocaleString()} and salary records generated`,
    data: {
      employeeId: employee._id,
      employeeName: employee.name,
      fixedSalary: employee.fixedSalary
    }
  });
});

// @desc    Get all salary records with filters
// @route   GET /api/admin/salary
// @access  Private (Admin/HR)
exports.getSalaryRecords = asyncHandler(async (req, res) => {
  const { month, department, status, search } = req.query;

  const filter = {};
  
  // Filter by month (default to current month)
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  filter.month = currentMonth;

  // Filter by department
  if (department && department !== 'all') {
    filter.department = department;
  }

  // Filter by status
  if (status && status !== 'all') {
    filter.status = status;
  }

  // Search by employee name
  if (search) {
    filter.employeeName = { $regex: search, $options: 'i' };
  }

  let salaries = await Salary.find(filter)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ paymentDate: 1, employeeName: 1 });

  // Calculate incentiveAmount for sales team employees from Incentive model's currentBalance
  // IMPORTANT: Only update incentiveAmount if status is 'pending' - preserve paid amounts for history
  for (const salary of salaries) {
    if (salary.employeeModel === 'Sales' && salary.department === 'sales') {
      try {
        // Only recalculate if incentive is still pending
        // If already paid, preserve the original amount for historical records
        if (salary.incentiveStatus === 'pending') {
          // Sum all currentBalance values from Incentive records for this sales employee
          const incentives = await Incentive.find({
            salesEmployee: salary.employeeId,
            currentBalance: { $gt: 0 }
          });
          
          const totalIncentive = incentives.reduce((sum, inc) => sum + (inc.currentBalance || 0), 0);
          
          // Update incentiveAmount if it's different
          if (Math.abs((salary.incentiveAmount || 0) - totalIncentive) > 0.01) {
            salary.incentiveAmount = totalIncentive;
            await salary.save();
          }
        }
      } catch (error) {
        console.error(`Error calculating incentive for salary ${salary._id}:`, error);
        // Continue with default 0 if error occurs
      }
    }
  }

  // Re-fetch salaries to get updated incentiveAmount values
  salaries = await Salary.find(filter)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ paymentDate: 1, employeeName: 1 });

  // Calculate statistics including incentive and reward amounts
  const stats = {
    totalEmployees: salaries.length,
    paidEmployees: salaries.filter(s => s.status === 'paid').length,
    pendingEmployees: salaries.filter(s => s.status === 'pending').length,
    totalAmount: salaries.reduce((sum, s) => sum + s.fixedSalary, 0),
    paidAmount: salaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.fixedSalary, 0),
    pendingAmount: salaries.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.fixedSalary, 0),
    totalIncentiveAmount: salaries.reduce((sum, s) => sum + (s.incentiveAmount || 0), 0),
    paidIncentiveAmount: salaries.filter(s => s.incentiveStatus === 'paid').reduce((sum, s) => sum + (s.incentiveAmount || 0), 0),
    pendingIncentiveAmount: salaries.filter(s => s.incentiveStatus === 'pending').reduce((sum, s) => sum + (s.incentiveAmount || 0), 0),
    totalRewardAmount: salaries.reduce((sum, s) => sum + (s.rewardAmount || 0), 0),
    paidRewardAmount: salaries.filter(s => s.rewardStatus === 'paid').reduce((sum, s) => sum + (s.rewardAmount || 0), 0),
    pendingRewardAmount: salaries.filter(s => s.rewardStatus === 'pending').reduce((sum, s) => sum + (s.rewardAmount || 0), 0)
  };

  res.json({
    success: true,
    data: salaries,
    stats,
    month: currentMonth
  });
});

// @desc    Get single salary record
// @route   GET /api/admin/salary/:id
// @access  Private (Admin/HR)
exports.getSalaryRecord = asyncHandler(async (req, res) => {
  const salary = await Salary.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!salary) {
    return res.status(404).json({
      success: false,
      message: 'Salary record not found'
    });
  }

  res.json({
    success: true,
    data: salary
  });
});

// @desc    Update salary record (mark as paid, update payment details)
// @route   PUT /api/admin/salary/:id
// @access  Private (Admin/HR)
exports.updateSalaryRecord = asyncHandler(async (req, res) => {
  const { status, paymentMethod, remarks, fixedSalary, incentiveStatus, rewardStatus } = req.body;

  const salary = await Salary.findById(req.params.id);
  if (!salary) {
    return res.status(404).json({
      success: false,
      message: 'Salary record not found'
    });
  }

  // Check if trying to edit past month (read-only)
  const salaryMonth = new Date(salary.month + '-01');
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  if (salaryMonth < currentMonth && salary.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Cannot edit salary records for past months that are already paid'
    });
  }

  // Store previous status for transaction creation and next month creation
  const previousStatus = salary.status;

  // Update fixedSalary if provided
  if (fixedSalary !== undefined) {
    if (fixedSalary < 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed salary must be greater than or equal to 0'
      });
    }
    salary.fixedSalary = fixedSalary;
  }

  // Update fields
  if (status) {
    if (!['pending', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "pending" or "paid"'
      });
    }
    salary.status = status;
    
    if (status === 'paid') {
      salary.paidDate = new Date();
      
      // Create finance transaction when salary is marked as paid
      try {
        const { createOutgoingTransaction } = require('../utils/financeTransactionHelper');
        const { mapSalaryPaymentMethodToFinance } = require('../utils/paymentMethodMapper');
        
        if (previousStatus !== 'paid') {
          await createOutgoingTransaction({
            amount: salary.fixedSalary,
            category: 'Salary Payment',
            transactionDate: salary.paidDate || new Date(),
            createdBy: req.admin.id,
            employee: salary.employeeId,
            paymentMethod: salary.paymentMethod ? mapSalaryPaymentMethodToFinance(salary.paymentMethod) : 'Bank Transfer',
            description: `Salary payment for ${salary.employeeName} - ${salary.month}`,
            metadata: {
              sourceType: 'salary',
              sourceId: salary._id.toString(),
              month: salary.month
            },
            checkDuplicate: true
          });
        }
      } catch (error) {
        // Log error but don't fail the salary update
        console.error('Error creating finance transaction for salary:', error);
      }

      // Auto-create next month's salary record when marking as paid
      if (previousStatus !== 'paid') {
        try {
          // Calculate next month
          const [year, monthStr] = salary.month.split('-');
          const month = parseInt(monthStr, 10) - 1; // Convert to 0-indexed (0-11)
          const nextMonthDate = new Date(parseInt(year), month + 1, 1); // Add 1 to get next month
          const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

          // Get employee to get joining date
          const employeeModel = getEmployeeModelType(salary.role === 'project-manager' ? 'pm' : 
                                                      salary.employeeModel === 'Sales' ? 'sales' : 'employee');
          const employee = await getEmployee(salary.employeeId, employeeModel);

          if (employee) {
            const joiningDate = employee.joiningDate || salary.paymentDate;
            const paymentDate = calculatePaymentDate(joiningDate, nextMonth);
            const paymentDay = new Date(joiningDate).getDate();

            // Check if next month's salary already exists
            const existingNextMonth = await Salary.findOne({
              employeeId: salary.employeeId,
              employeeModel: salary.employeeModel,
              month: nextMonth
            });

            // Only create if it doesn't exist
            if (!existingNextMonth) {
              await Salary.create({
                employeeId: salary.employeeId,
                employeeModel: salary.employeeModel,
                employeeName: salary.employeeName,
                department: salary.department,
                role: salary.role,
                month: nextMonth,
                fixedSalary: salary.fixedSalary, // Use same salary amount
                paymentDate: paymentDate,
                paymentDay: paymentDay,
                status: 'pending',
                createdBy: req.admin.id
              });
            }
          }
        } catch (error) {
          // Log error but don't fail the salary update
          console.error('Error creating next month salary record:', error);
        }
      }
    } else {
      salary.paidDate = null;
      salary.paymentMethod = null;
      
      // Cancel transaction if status changed back to pending
      try {
        const { cancelTransactionForSource } = require('../utils/financeTransactionHelper');
        await cancelTransactionForSource({
          sourceType: 'salary',
          sourceId: salary._id.toString()
        }, 'cancel');
      } catch (error) {
        console.error('Error canceling finance transaction for salary:', error);
      }
    }
  }

  if (paymentMethod && salary.status === 'paid') {
    salary.paymentMethod = paymentMethod;
  }

  if (remarks !== undefined) {
    salary.remarks = remarks;
  }

  // Handle separate incentive status update
  if (incentiveStatus !== undefined) {
    if (!['pending', 'paid'].includes(incentiveStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incentiveStatus. Must be "pending" or "paid"'
      });
    }
    
    // Only allow incentive updates for sales team
    if (salary.employeeModel === 'Sales' && salary.department === 'sales') {
      const previousIncentiveStatus = salary.incentiveStatus;
      salary.incentiveStatus = incentiveStatus;
      
      if (incentiveStatus === 'paid') {
        salary.incentivePaidDate = new Date();
        
        // Find all Incentive records for this sales employee with currentBalance > 0
        const incentives = await Incentive.find({
          salesEmployee: salary.employeeId,
          currentBalance: { $gt: 0 }
        });

        // Calculate total incentive amount BEFORE clearing currentBalance
        // This preserves the amount that was paid for historical records
        const totalIncentiveAmount = incentives.reduce((sum, inc) => sum + (inc.currentBalance || 0), 0);
        
        // Store the incentive amount before clearing balances
        if (totalIncentiveAmount > 0) {
          salary.incentiveAmount = totalIncentiveAmount;
        }

        // Set currentBalance to 0 for all incentive records
        for (const incentive of incentives) {
          incentive.currentBalance = 0;
          if (!incentive.paidAt) {
            incentive.paidAt = new Date();
          }
          await incentive.save();
        }

        // Create finance transaction for incentive payment
        try {
          const { createOutgoingTransaction } = require('../utils/financeTransactionHelper');
          const { mapSalaryPaymentMethodToFinance } = require('../utils/paymentMethodMapper');
          
          if (previousIncentiveStatus !== 'paid' && salary.incentiveAmount > 0) {
            await createOutgoingTransaction({
              amount: salary.incentiveAmount,
              category: 'Incentive Payment',
              transactionDate: salary.incentivePaidDate || new Date(),
              createdBy: req.admin.id,
              employee: salary.employeeId,
              paymentMethod: paymentMethod ? mapSalaryPaymentMethodToFinance(paymentMethod) : 'Bank Transfer',
              description: `Incentive payment for ${salary.employeeName} - ${salary.month}`,
              metadata: {
                sourceType: 'incentive',
                sourceId: salary._id.toString(),
                month: salary.month
              },
              checkDuplicate: true
            });
          }
        } catch (error) {
          console.error('Error creating finance transaction for incentive:', error);
        }
      } else {
        salary.incentivePaidDate = null;
      }
    }
  }

  // Handle separate reward status update
  if (rewardStatus !== undefined) {
    if (!['pending', 'paid'].includes(rewardStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rewardStatus. Must be "pending" or "paid"'
      });
    }
    
    const previousRewardStatus = salary.rewardStatus;
    salary.rewardStatus = rewardStatus;
    
    if (rewardStatus === 'paid') {
      salary.rewardPaidDate = new Date();
      
      // Create finance transaction for reward payment
      try {
        const { createOutgoingTransaction } = require('../utils/financeTransactionHelper');
        const { mapSalaryPaymentMethodToFinance } = require('../utils/paymentMethodMapper');
        
        if (previousRewardStatus !== 'paid' && salary.rewardAmount > 0) {
          await createOutgoingTransaction({
            amount: salary.rewardAmount,
            category: 'Reward Payment',
            transactionDate: salary.rewardPaidDate || new Date(),
            createdBy: req.admin.id,
            employee: salary.employeeId,
            paymentMethod: paymentMethod ? mapSalaryPaymentMethodToFinance(paymentMethod) : 'Bank Transfer',
            description: `Reward payment for ${salary.employeeName} - ${salary.month}`,
            metadata: {
              sourceType: 'reward',
              sourceId: salary._id.toString(),
              month: salary.month
            },
            checkDuplicate: true
          });
        }
      } catch (error) {
        console.error('Error creating finance transaction for reward:', error);
      }
    } else {
      salary.rewardPaidDate = null;
    }
  }

  salary.updatedBy = req.admin.id;
  await salary.save();

  res.json({
    success: true,
    message: 'Salary record updated successfully',
    data: salary
  });
});

// @desc    Generate salary records for a specific month (auto-generation)
// @route   POST /api/admin/salary/generate/:month
// @access  Private (Admin/HR)
exports.generateMonthlySalaries = asyncHandler(async (req, res) => {
  const { month } = req.params;

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid month format. Use YYYY-MM'
    });
  }

  // Get all employees with fixedSalary > 0
  const employees = await Employee.find({ fixedSalary: { $gt: 0 }, isActive: true });
  const sales = await Sales.find({ fixedSalary: { $gt: 0 }, isActive: true });
  const pms = await PM.find({ fixedSalary: { $gt: 0 }, isActive: true });

  const allEmployees = [
    ...employees.map(e => ({ ...e.toObject(), modelType: 'Employee', model: Employee })),
    ...sales.map(s => ({ ...s.toObject(), modelType: 'Sales', model: Sales })),
    ...pms.map(p => ({ ...p.toObject(), modelType: 'PM', model: PM }))
  ];

  let generated = 0;
  let updated = 0;

  for (const emp of allEmployees) {
    const joiningDate = emp.joiningDate;
    const paymentDate = calculatePaymentDate(joiningDate, month);
    const paymentDay = new Date(joiningDate).getDate();

    const existing = await Salary.findOne({
      employeeId: emp._id,
      employeeModel: emp.modelType,
      month
    });

    // Calculate incentiveAmount for sales team
    let incentiveAmount = 0;
    if (emp.modelType === 'Sales') {
      try {
        const incentives = await Incentive.find({
          salesEmployee: emp._id,
          currentBalance: { $gt: 0 }
        });
        incentiveAmount = incentives.reduce((sum, inc) => sum + (inc.currentBalance || 0), 0);
      } catch (error) {
        console.error(`Error calculating incentive for employee ${emp._id}:`, error);
      }
    }

    if (existing) {
      // Update existing record if salary changed
      if (existing.fixedSalary !== emp.fixedSalary) {
        existing.fixedSalary = emp.fixedSalary;
        existing.paymentDate = paymentDate;
        existing.paymentDay = paymentDay;
        // Update incentiveAmount if it's a sales employee
        if (emp.modelType === 'Sales') {
          existing.incentiveAmount = incentiveAmount;
        }
        existing.updatedBy = req.admin.id;
        await existing.save();
        updated++;
      } else if (emp.modelType === 'Sales' && Math.abs((existing.incentiveAmount || 0) - incentiveAmount) > 0.01) {
        // Update incentiveAmount even if salary hasn't changed
        existing.incentiveAmount = incentiveAmount;
        existing.updatedBy = req.admin.id;
        await existing.save();
        updated++;
      }
    } else {
      // Create new record
      await Salary.create({
        employeeId: emp._id,
        employeeModel: emp.modelType,
        employeeName: emp.name,
        department: emp.department || 'unknown',
        role: emp.role || 'employee',
        month,
        fixedSalary: emp.fixedSalary,
        paymentDate,
        paymentDay,
        status: 'pending',
        incentiveAmount,
        incentiveStatus: 'pending',
        rewardAmount: 0,
        rewardStatus: 'pending',
        createdBy: req.admin.id
      });
      generated++;
    }
  }

  res.json({
    success: true,
    message: `Salary records generated: ${generated} new, ${updated} updated`,
    data: {
      generated,
      updated,
      total: allEmployees.length
    }
  });
});

// @desc    Get salary history for an employee
// @route   GET /api/admin/salary/employee/:userType/:employeeId
// @access  Private (Admin/HR)
exports.getEmployeeSalaryHistory = asyncHandler(async (req, res) => {
  const { userType, employeeId } = req.params;

  const employeeModel = getEmployeeModelType(userType);
  if (!employeeModel) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user type'
    });
  }

  const salaries = await Salary.find({
    employeeId,
    employeeModel
  })
    .sort({ month: -1 })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  res.json({
    success: true,
    data: salaries
  });
});

// @desc    Delete salary record (only for pending and current/future months)
// @route   DELETE /api/admin/salary/:id
// @access  Private (Admin/HR)
exports.deleteSalaryRecord = asyncHandler(async (req, res) => {
  const salary = await Salary.findById(req.params.id);
  
  if (!salary) {
    return res.status(404).json({
      success: false,
      message: 'Salary record not found'
    });
  }

  // Only allow deletion of pending records in current/future months
  const salaryMonth = new Date(salary.month + '-01');
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  if (salary.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete paid salary records'
    });
  }

  if (salaryMonth < currentMonth) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete salary records for past months'
    });
  }

  await Salary.findByIdAndDelete(salary._id);

  res.json({
    success: true,
    message: 'Salary record deleted successfully'
  });
});

// @desc    Update incentive payment status
// @route   PUT /api/admin/salary/:id/incentive
// @access  Private (Admin/HR)
exports.updateIncentivePayment = asyncHandler(async (req, res) => {
  const { incentiveStatus, paymentMethod, remarks } = req.body;

  if (!incentiveStatus || !['pending', 'paid'].includes(incentiveStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Valid incentiveStatus (pending or paid) is required'
    });
  }

  const salary = await Salary.findById(req.params.id);
  if (!salary) {
    return res.status(404).json({
      success: false,
      message: 'Salary record not found'
    });
  }

  // Only allow incentive updates for sales team
  if (salary.employeeModel !== 'Sales' || salary.department !== 'sales') {
    return res.status(400).json({
      success: false,
      message: 'Incentive payment is only available for sales team employees'
    });
  }

  const previousStatus = salary.incentiveStatus;

  // Update incentive status
  salary.incentiveStatus = incentiveStatus;

  if (incentiveStatus === 'paid') {
    salary.incentivePaidDate = new Date();
    
    // Find all Incentive records for this sales employee with currentBalance > 0
    const incentives = await Incentive.find({
      salesEmployee: salary.employeeId,
      currentBalance: { $gt: 0 }
    });

    // Calculate total incentive amount BEFORE clearing currentBalance
    // This preserves the amount that was paid for historical records
    const totalIncentiveAmount = incentives.reduce((sum, inc) => sum + (inc.currentBalance || 0), 0);
    
    // Store the incentive amount before clearing balances
    if (totalIncentiveAmount > 0) {
      salary.incentiveAmount = totalIncentiveAmount;
    }

    // Set currentBalance to 0 for all incentive records
    for (const incentive of incentives) {
      incentive.currentBalance = 0;
      if (!incentive.paidAt) {
        incentive.paidAt = new Date();
      }
      await incentive.save();
    }

    // Create finance transaction for incentive payment
    try {
      const { createOutgoingTransaction } = require('../utils/financeTransactionHelper');
      const { mapSalaryPaymentMethodToFinance } = require('../utils/paymentMethodMapper');
      
      if (previousStatus !== 'paid' && salary.incentiveAmount > 0) {
        await createOutgoingTransaction({
          amount: salary.incentiveAmount,
          category: 'Incentive Payment',
          transactionDate: salary.incentivePaidDate || new Date(),
          createdBy: req.admin.id,
          employee: salary.employeeId,
          paymentMethod: paymentMethod ? mapSalaryPaymentMethodToFinance(paymentMethod) : 'Bank Transfer',
          description: `Incentive payment for ${salary.employeeName} - ${salary.month}`,
          metadata: {
            sourceType: 'incentive',
            sourceId: salary._id.toString(),
            month: salary.month
          },
          checkDuplicate: true
        });
      }
    } catch (error) {
      console.error('Error creating finance transaction for incentive:', error);
    }
  } else {
    salary.incentivePaidDate = null;
    
    // Cancel transaction if status changed back to pending
    try {
      const { cancelTransactionForSource } = require('../utils/financeTransactionHelper');
      await cancelTransactionForSource({
        sourceType: 'incentive',
        sourceId: salary._id.toString()
      }, 'cancel');
    } catch (error) {
      console.error('Error canceling finance transaction for incentive:', error);
    }
  }

  if (paymentMethod && salary.incentiveStatus === 'paid') {
    // Store payment method in remarks or create a separate field if needed
    if (remarks) {
      salary.remarks = (salary.remarks || '') + ` [Incentive Payment: ${paymentMethod}]`;
    }
  }

  if (remarks && salary.incentiveStatus === 'paid') {
    salary.remarks = (salary.remarks || '') + ` [Incentive: ${remarks}]`;
  }

  salary.updatedBy = req.admin.id;
  await salary.save();

  res.json({
    success: true,
    message: 'Incentive payment status updated successfully',
    data: salary
  });
});

// @desc    Update reward payment status
// @route   PUT /api/admin/salary/:id/reward
// @access  Private (Admin/HR)
exports.updateRewardPayment = asyncHandler(async (req, res) => {
  const { rewardStatus, paymentMethod, remarks } = req.body;

  if (!rewardStatus || !['pending', 'paid'].includes(rewardStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Valid rewardStatus (pending or paid) is required'
    });
  }

  const salary = await Salary.findById(req.params.id);
  if (!salary) {
    return res.status(404).json({
      success: false,
      message: 'Salary record not found'
    });
  }

  const previousStatus = salary.rewardStatus;

  // Update reward status
  salary.rewardStatus = rewardStatus;

  if (rewardStatus === 'paid') {
    salary.rewardPaidDate = new Date();
    
    // Create finance transaction for reward payment
    try {
      const { createOutgoingTransaction } = require('../utils/financeTransactionHelper');
      const { mapSalaryPaymentMethodToFinance } = require('../utils/paymentMethodMapper');
      
      if (previousStatus !== 'paid' && salary.rewardAmount > 0) {
        await createOutgoingTransaction({
          amount: salary.rewardAmount,
          category: 'Reward Payment',
          transactionDate: salary.rewardPaidDate || new Date(),
          createdBy: req.admin.id,
          employee: salary.employeeId,
          paymentMethod: paymentMethod ? mapSalaryPaymentMethodToFinance(paymentMethod) : 'Bank Transfer',
          description: `Reward payment for ${salary.employeeName} - ${salary.month}`,
          metadata: {
            sourceType: 'reward',
            sourceId: salary._id.toString(),
            month: salary.month
          },
          checkDuplicate: true
        });
      }
    } catch (error) {
      console.error('Error creating finance transaction for reward:', error);
    }
  } else {
    salary.rewardPaidDate = null;
    
    // Cancel transaction if status changed back to pending
    try {
      const { cancelTransactionForSource } = require('../utils/financeTransactionHelper');
      await cancelTransactionForSource({
        sourceType: 'reward',
        sourceId: salary._id.toString()
      }, 'cancel');
    } catch (error) {
      console.error('Error canceling finance transaction for reward:', error);
    }
  }

  if (paymentMethod && salary.rewardStatus === 'paid') {
    if (remarks) {
      salary.remarks = (salary.remarks || '') + ` [Reward Payment: ${paymentMethod}]`;
    }
  }

  if (remarks && salary.rewardStatus === 'paid') {
    salary.remarks = (salary.remarks || '') + ` [Reward: ${remarks}]`;
  }

  salary.updatedBy = req.admin.id;
  await salary.save();

  res.json({
    success: true,
    message: 'Reward payment status updated successfully',
    data: salary
  });
});

