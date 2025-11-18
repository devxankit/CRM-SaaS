const RecurringExpense = require('../models/RecurringExpense');
const ExpenseEntry = require('../models/ExpenseEntry');
const asyncHandler = require('../middlewares/asyncHandler');

// Helper: Generate expense entries for a recurring expense up to specified date
const generateExpenseEntriesHelper = async (recurringExpense, upToDate = null) => {
  if (recurringExpense.status !== 'active') {
    return { created: 0, skipped: 0 };
  }

  const endDate = upToDate || new Date();
  const startDate = new Date(recurringExpense.startDate);
  const expenseEndDate = recurringExpense.endDate ? new Date(recurringExpense.endDate) : null;

  if (expenseEndDate && expenseEndDate < startDate) {
    return { created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;
  let currentDate = new Date(startDate);

  // Get existing entries for this recurring expense
  const existingEntries = await ExpenseEntry.find({
    recurringExpenseId: recurringExpense._id
  }).select('period');

  const existingPeriods = new Set(existingEntries.map(e => e.period));

  while (currentDate <= endDate) {
    if (expenseEndDate && currentDate > expenseEndDate) {
      break;
    }

    // Calculate period string based on frequency
    let period;
    switch (recurringExpense.frequency) {
      case 'monthly':
        period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarterly':
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
        period = `${currentDate.getFullYear()}-Q${quarter}`;
        break;
      case 'yearly':
        period = `${currentDate.getFullYear()}`;
        break;
    }

    // Skip if entry already exists
    if (existingPeriods.has(period)) {
      skipped++;
    } else {
      // Calculate due date
      const dueDate = new Date(currentDate);
      const dayOfMonth = recurringExpense.dayOfMonth || 1;
      const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
      dueDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));

      // Determine status based on due date
      let status = 'pending';
      if (dueDate < new Date()) {
        status = 'overdue';
      }

      await ExpenseEntry.create({
        recurringExpenseId: recurringExpense._id,
        period,
        amount: recurringExpense.amount,
        dueDate,
        status,
        createdBy: recurringExpense.createdBy
      });
      created++;
    }

    // Move to next period
    switch (recurringExpense.frequency) {
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
  }

  // Update next due date
  if (recurringExpense.status === 'active') {
    // Find the first unpaid/pending entry (next due)
    const nextDueEntry = await ExpenseEntry.findOne({
      recurringExpenseId: recurringExpense._id,
      status: { $in: ['pending', 'overdue'] }
    }).sort({ dueDate: 1 }); // Sort ascending to get the earliest unpaid entry

    if (nextDueEntry) {
      // Use the due date of the first unpaid entry
      recurringExpense.nextDueDate = nextDueEntry.dueDate;
    } else {
      // If all entries are paid, calculate next due from the last entry
      const lastEntry = await ExpenseEntry.findOne({
        recurringExpenseId: recurringExpense._id
      }).sort({ dueDate: -1 });

      if (lastEntry) {
        // Calculate next due from last entry
        let nextDue = new Date(lastEntry.dueDate);
        switch (recurringExpense.frequency) {
          case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case 'quarterly':
            nextDue.setMonth(nextDue.getMonth() + 3);
            break;
          case 'yearly':
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            break;
        }
        const dayOfMonth = recurringExpense.dayOfMonth || 1;
        const lastDayOfNextMonth = new Date(nextDue.getFullYear(), nextDue.getMonth() + 1, 0).getDate();
        nextDue.setDate(Math.min(dayOfMonth, lastDayOfNextMonth));
        
        recurringExpense.nextDueDate = nextDue;
      } else {
        // No entries yet, calculate from start date
        let nextDue = new Date(recurringExpense.startDate);
        switch (recurringExpense.frequency) {
          case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case 'quarterly':
            nextDue.setMonth(nextDue.getMonth() + 3);
            break;
          case 'yearly':
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            break;
        }
        const dayOfMonth = recurringExpense.dayOfMonth || 1;
        const lastDayOfNextMonth = new Date(nextDue.getFullYear(), nextDue.getMonth() + 1, 0).getDate();
        nextDue.setDate(Math.min(dayOfMonth, lastDayOfNextMonth));
        
        recurringExpense.nextDueDate = nextDue;
      }
    }
    
    await recurringExpense.save();
  }

  return { created, skipped };
};

// @desc    Create new recurring expense
// @route   POST /api/admin/users/recurring-expenses
// @access  Private (Admin/HR)
exports.createRecurringExpense = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    amount,
    frequency,
    startDate,
    endDate,
    status,
    description,
    vendor,
    paymentMethod,
    dayOfMonth,
    autoPay
  } = req.body;

  // Validation
  if (!name || !category || !amount || !frequency || !startDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, category, amount, frequency, and startDate'
    });
  }

  if (!['rent', 'utilities', 'maintenance', 'software', 'insurance', 'marketing', 'travel', 'other'].includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category'
    });
  }

  if (!['monthly', 'quarterly', 'yearly'].includes(frequency)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid frequency. Must be monthly, quarterly, or yearly'
    });
  }

  if (amount < 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount cannot be negative'
    });
  }

  // Create recurring expense
  const recurringExpense = await RecurringExpense.create({
    name,
    category,
    amount,
    frequency,
    startDate,
    endDate: endDate || null,
    status: status || 'active',
    description: description || '',
    vendor: vendor || '',
    paymentMethod: paymentMethod || 'bank_transfer',
    dayOfMonth: dayOfMonth || new Date(startDate).getDate(),
    autoPay: autoPay !== undefined ? autoPay : false,
    createdBy: req.admin.id,
    nextDueDate: new Date(startDate)
  });

  // Generate initial expense entries (for next 12 months or until end date)
  const generateUntil = new Date();
  generateUntil.setMonth(generateUntil.getMonth() + 12);
  if (endDate) {
    const endDateObj = new Date(endDate);
    if (endDateObj < generateUntil) {
      generateUntil.setTime(endDateObj.getTime());
    }
  }

  const { created, skipped } = await generateExpenseEntriesHelper(recurringExpense, generateUntil);

  res.status(201).json({
    success: true,
    message: 'Recurring expense created successfully',
    data: recurringExpense,
    entriesGenerated: { created, skipped }
  });
});

// @desc    Get all recurring expenses with filters
// @route   GET /api/admin/users/recurring-expenses
// @access  Private (Admin/HR)
exports.getAllRecurringExpenses = asyncHandler(async (req, res) => {
  const { status, category, frequency, search } = req.query;

  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (frequency && frequency !== 'all') {
    filter.frequency = frequency;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { vendor: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const recurringExpenses = await RecurringExpense.find(filter)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 });

  // Add paid/due status for each recurring expense
  const expensesWithStatus = await Promise.all(recurringExpenses.map(async (expense) => {
    const expenseObj = expense.toObject();
    
    // Check if there are any unpaid/overdue entries
    const unpaidEntries = await ExpenseEntry.find({
      recurringExpenseId: expense._id,
      status: { $in: ['pending', 'overdue'] }
    }).sort({ dueDate: 1 }).limit(1);
    
    // Check if there are any paid entries
    const paidEntries = await ExpenseEntry.find({
      recurringExpenseId: expense._id,
      status: 'paid'
    }).countDocuments();
    
    // Determine status: 'paid' if all entries are paid, 'due' if there are unpaid entries
    if (unpaidEntries.length > 0) {
      expenseObj.paymentStatus = 'due';
      expenseObj.nextDueEntry = unpaidEntries[0] ? {
        dueDate: unpaidEntries[0].dueDate,
        amount: unpaidEntries[0].amount
      } : null;
    } else if (paidEntries > 0) {
      expenseObj.paymentStatus = 'paid';
    } else {
      expenseObj.paymentStatus = 'pending'; // No entries yet
    }
    
    return expenseObj;
  }));

  // Calculate statistics
  const stats = {
    totalExpenses: expensesWithStatus.length,
    activeExpenses: expensesWithStatus.filter(exp => exp.status === 'active').length,
    inactiveExpenses: expensesWithStatus.filter(exp => exp.status === 'inactive').length,
    pausedExpenses: expensesWithStatus.filter(exp => exp.status === 'paused').length,
    monthlyTotal: 0,
    yearlyTotal: 0,
    categories: {}
  };

  expensesWithStatus.forEach(expense => {
    if (expense.status === 'active') {
      if (expense.frequency === 'monthly') {
        stats.monthlyTotal += expense.amount;
        stats.yearlyTotal += expense.amount * 12;
      } else if (expense.frequency === 'quarterly') {
        stats.monthlyTotal += expense.amount / 3;
        stats.yearlyTotal += expense.amount * 4;
      } else if (expense.frequency === 'yearly') {
        stats.monthlyTotal += expense.amount / 12;
        stats.yearlyTotal += expense.amount;
      }

      if (!stats.categories[expense.category]) {
        stats.categories[expense.category] = 0;
      }
      stats.categories[expense.category]++;
    }
  });

  stats.monthlyTotal = Math.round(stats.monthlyTotal);
  stats.yearlyTotal = Math.round(stats.yearlyTotal);

  res.json({
    success: true,
    data: expensesWithStatus,
    stats
  });
});

// @desc    Get single recurring expense by ID
// @route   GET /api/admin/users/recurring-expenses/:id
// @access  Private (Admin/HR)
exports.getRecurringExpenseById = asyncHandler(async (req, res) => {
  const recurringExpense = await RecurringExpense.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!recurringExpense) {
    return res.status(404).json({
      success: false,
      message: 'Recurring expense not found'
    });
  }

  // Get expense entries for this recurring expense
  const entries = await ExpenseEntry.find({
    recurringExpenseId: recurringExpense._id
  })
    .sort({ dueDate: 1 })
    .populate('createdBy', 'name email')
    .populate('paidBy', 'name email');

  res.json({
    success: true,
    data: {
      ...recurringExpense.toObject(),
      entries
    }
  });
});

// @desc    Update recurring expense
// @route   PUT /api/admin/users/recurring-expenses/:id
// @access  Private (Admin/HR)
exports.updateRecurringExpense = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    amount,
    frequency,
    startDate,
    endDate,
    status,
    description,
    vendor,
    paymentMethod,
    dayOfMonth,
    autoPay
  } = req.body;

  const recurringExpense = await RecurringExpense.findById(req.params.id);
  if (!recurringExpense) {
    return res.status(404).json({
      success: false,
      message: 'Recurring expense not found'
    });
  }

  // Update fields
  if (name !== undefined) recurringExpense.name = name;
  if (category !== undefined) {
    if (!['rent', 'utilities', 'maintenance', 'software', 'insurance', 'marketing', 'travel', 'other'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    recurringExpense.category = category;
  }
  if (amount !== undefined) {
    if (amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount cannot be negative'
      });
    }
    recurringExpense.amount = amount;
  }
  if (frequency !== undefined) {
    if (!['monthly', 'quarterly', 'yearly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid frequency'
      });
    }
    recurringExpense.frequency = frequency;
  }
  if (startDate !== undefined) recurringExpense.startDate = startDate;
  if (endDate !== undefined) recurringExpense.endDate = endDate || null;
  if (status !== undefined) {
    if (!['active', 'inactive', 'paused'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    recurringExpense.status = status;
  }
  if (description !== undefined) recurringExpense.description = description;
  if (vendor !== undefined) recurringExpense.vendor = vendor;
  if (paymentMethod !== undefined) recurringExpense.paymentMethod = paymentMethod;
  if (dayOfMonth !== undefined) recurringExpense.dayOfMonth = dayOfMonth;
  if (autoPay !== undefined) recurringExpense.autoPay = autoPay;

  recurringExpense.updatedBy = req.admin.id;

  await recurringExpense.save();

  // If expense is active, generate missing entries
  if (recurringExpense.status === 'active') {
    const generateUntil = new Date();
    generateUntil.setMonth(generateUntil.getMonth() + 12);
    if (recurringExpense.endDate) {
      const endDateObj = new Date(recurringExpense.endDate);
      if (endDateObj < generateUntil) {
        generateUntil.setTime(endDateObj.getTime());
      }
    }
    await generateExpenseEntriesHelper(recurringExpense, generateUntil);
  }

  res.json({
    success: true,
    message: 'Recurring expense updated successfully',
    data: recurringExpense
  });
});

// @desc    Delete recurring expense
// @route   DELETE /api/admin/users/recurring-expenses/:id
// @access  Private (Admin/HR)
exports.deleteRecurringExpense = asyncHandler(async (req, res) => {
  const recurringExpense = await RecurringExpense.findById(req.params.id);
  
  if (!recurringExpense) {
    return res.status(404).json({
      success: false,
      message: 'Recurring expense not found'
    });
  }

  // Delete all associated expense entries
  await ExpenseEntry.deleteMany({ recurringExpenseId: recurringExpense._id });

  // Delete the recurring expense
  await RecurringExpense.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Recurring expense and all associated entries deleted successfully'
  });
});

// @desc    Generate expense entries for a recurring expense (up to 12 months ahead)
// @route   POST /api/admin/users/recurring-expenses/:id/generate-entries
// @access  Private (Admin/HR)
exports.generateExpenseEntries = asyncHandler(async (req, res) => {
  const recurringExpense = await RecurringExpense.findById(req.params.id);
  
  if (!recurringExpense) {
    return res.status(404).json({
      success: false,
      message: 'Recurring expense not found'
    });
  }

  if (recurringExpense.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Cannot generate entries for inactive or paused expenses'
    });
  }

  const generateUntil = new Date();
  generateUntil.setMonth(generateUntil.getMonth() + 12);
  if (recurringExpense.endDate) {
    const endDateObj = new Date(recurringExpense.endDate);
    if (endDateObj < generateUntil) {
      generateUntil.setTime(endDateObj.getTime());
    }
  }

  const { created, skipped } = await generateExpenseEntriesHelper(recurringExpense, generateUntil);

  res.json({
    success: true,
    message: `Generated ${created} new expense entries, skipped ${skipped} existing entries`,
    data: { created, skipped }
  });
});

// @desc    Get expense entries for a specific period
// @route   GET /api/admin/users/recurring-expenses/entries
// @access  Private (Admin/HR)
exports.getExpenseEntries = asyncHandler(async (req, res) => {
  const { month, year, status, category, recurringExpenseId } = req.query;

  let filter = {};

  // Filter by recurring expense ID
  if (recurringExpenseId) {
    filter.recurringExpenseId = recurringExpenseId;
  }

  // Filter by period
  if (month && year) {
    const period = `${year}-${String(month).padStart(2, '0')}`;
    filter.period = { $regex: `^${period}` };
  } else if (year) {
    filter.period = { $regex: `^${year}` };
  }

  // Filter by status
  if (status && status !== 'all') {
    filter.status = status;
  }

  // Filter by category (through recurring expense)
  if (category && category !== 'all') {
    const recurringExpenses = await RecurringExpense.find({ category }).select('_id');
    if (filter.recurringExpenseId) {
      // If recurringExpenseId is already set, combine with category filter
      const categoryExpenses = recurringExpenses.map(re => re._id.toString());
      if (Array.isArray(filter.recurringExpenseId)) {
        filter.recurringExpenseId = { $in: filter.recurringExpenseId.filter(id => categoryExpenses.includes(id.toString())) };
      } else {
        filter.recurringExpenseId = categoryExpenses.includes(filter.recurringExpenseId.toString()) ? filter.recurringExpenseId : null;
      }
    } else {
      filter.recurringExpenseId = { $in: recurringExpenses.map(re => re._id) };
    }
  }

  const entries = await ExpenseEntry.find(filter)
    .populate({
      path: 'recurringExpenseId',
      select: 'name category amount frequency vendor paymentMethod'
    })
    .populate('createdBy', 'name email')
    .populate('paidBy', 'name email')
    .sort({ dueDate: 1 });

  // Calculate statistics
  const stats = {
    totalEntries: entries.length,
    pendingEntries: entries.filter(e => e.status === 'pending').length,
    paidEntries: entries.filter(e => e.status === 'paid').length,
    overdueEntries: entries.filter(e => e.status === 'overdue').length,
    totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
    paidAmount: entries.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
    pendingAmount: entries.filter(e => e.status === 'pending' || e.status === 'overdue').reduce((sum, e) => sum + e.amount, 0)
  };

  res.json({
    success: true,
    data: entries,
    stats
  });
});

// @desc    Mark expense entry as paid
// @route   PUT /api/admin/users/recurring-expenses/entries/:id/pay
// @access  Private (Admin/HR)
exports.markEntryAsPaid = asyncHandler(async (req, res) => {
  const { paymentMethod, paymentReference, notes } = req.body;

  const entry = await ExpenseEntry.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Expense entry not found'
    });
  }

  const previousStatus = entry.status;

  entry.status = 'paid';
  entry.paidDate = new Date();
  entry.paymentMethod = paymentMethod || entry.paymentMethod;
  entry.paymentReference = paymentReference || '';
  entry.notes = notes || '';
  entry.paidBy = req.admin.id;

  await entry.save();

  // Update recurring expense last paid date
  const recurringExpense = await RecurringExpense.findById(entry.recurringExpenseId);
  if (recurringExpense) {
    recurringExpense.lastPaidDate = entry.paidDate;
    
    // Update next due date to the first unpaid entry
    const nextDueEntry = await ExpenseEntry.findOne({
      recurringExpenseId: recurringExpense._id,
      status: { $in: ['pending', 'overdue'] }
    }).sort({ dueDate: 1 });

    if (nextDueEntry) {
      recurringExpense.nextDueDate = nextDueEntry.dueDate;
    } else {
      // If all entries are paid, calculate next due from this entry
      let nextDue = new Date(entry.dueDate);
      switch (recurringExpense.frequency) {
        case 'monthly':
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case 'quarterly':
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case 'yearly':
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
      }
      const dayOfMonth = recurringExpense.dayOfMonth || 1;
      const lastDayOfNextMonth = new Date(nextDue.getFullYear(), nextDue.getMonth() + 1, 0).getDate();
      nextDue.setDate(Math.min(dayOfMonth, lastDayOfNextMonth));
      
      recurringExpense.nextDueDate = nextDue;
    }
    
    await recurringExpense.save();
  }

  // Create finance transaction when expense entry is marked as paid
  try {
    const { createOutgoingTransaction } = require('../utils/financeTransactionHelper');
    const { mapPaymentMethodToFinance } = require('../utils/paymentMethodMapper');
    
    if (previousStatus !== 'paid') {
      await createOutgoingTransaction({
        amount: entry.amount,
        category: recurringExpense.category || 'Recurring Expense',
        transactionDate: entry.paidDate || new Date(),
        createdBy: req.admin.id,
        vendor: recurringExpense.vendor,
        paymentMethod: entry.paymentMethod ? mapPaymentMethodToFinance(entry.paymentMethod) : 'Bank Transfer',
        description: `Recurring expense: ${recurringExpense.name} - ${entry.period}`,
        metadata: {
          sourceType: 'expenseEntry',
          sourceId: entry._id.toString(),
          recurringExpenseId: recurringExpense._id.toString()
        },
        checkDuplicate: true
      });
    }
  } catch (error) {
    // Log error but don't fail the expense update
    console.error('Error creating finance transaction for expense entry:', error);
  }

  res.json({
    success: true,
    message: 'Expense entry marked as paid',
    data: entry
  });
});

