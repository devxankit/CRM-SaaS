const Lead = require('../models/Lead');
const LeadCategory = require('../models/LeadCategory');
const Incentive = require('../models/Incentive');
const Sales = require('../models/Sales');
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create single lead
// @route   POST /api/admin/sales/leads
// @access  Private (Admin/HR only)
const createLead = asyncHandler(async (req, res, next) => {
  const { phone, name, company, email, category, priority, value, notes } = req.body;

  // Validate required fields
  if (!phone || !category) {
    return next(new ErrorResponse('Phone number and category are required', 400));
  }

  // Check if lead with phone number already exists
  const existingLead = await Lead.findOne({ phone });
  if (existingLead) {
    return next(new ErrorResponse('Lead with this phone number already exists', 400));
  }

  // Verify category exists
  const categoryExists = await LeadCategory.findById(category);
  if (!categoryExists) {
    return next(new ErrorResponse('Invalid category', 400));
  }

  const lead = await Lead.create({
    phone,
    name,
    company,
    email,
    category,
    priority: priority || 'medium',
    notes,
    createdBy: req.admin.id,
    creatorModel: 'Admin'
  });

  await lead.populate('category', 'name color icon');
  await lead.populate('createdBy', 'name');

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: lead
  });
});

// @desc    Create bulk leads
// @route   POST /api/admin/sales/leads/bulk
// @access  Private (Admin/HR only)
const createBulkLeads = asyncHandler(async (req, res, next) => {
  const { phoneNumbers, category, priority } = req.body;

  if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    return next(new ErrorResponse('Phone numbers array is required', 400));
  }

  if (phoneNumbers.length > 1000) {
    return next(new ErrorResponse('Cannot process more than 1000 leads at once', 400));
  }

  if (!category) {
    return next(new ErrorResponse('Category is required for bulk upload', 400));
  }

  // Verify category exists
  const categoryExists = await LeadCategory.findById(category);
  if (!categoryExists) {
    return next(new ErrorResponse('Invalid category', 400));
  }

  const results = {
    created: 0,
    skipped: 0,
    errors: []
  };

  for (const phone of phoneNumbers) {
    try {
      // Validate phone number format
      if (!/^[0-9]{10}$/.test(phone)) {
        results.errors.push({ phone, error: 'Invalid phone number format' });
        results.skipped++;
        continue;
      }

      // Check if lead already exists
      const existingLead = await Lead.findOne({ phone });
      if (existingLead) {
        results.errors.push({ phone, error: 'Lead already exists' });
        results.skipped++;
        continue;
      }

      await Lead.create({
        phone,
        category,
        priority: priority || 'medium',
        source: 'bulk_upload',
        createdBy: req.admin.id,
        creatorModel: 'Admin'
      });

      results.created++;
    } catch (error) {
      results.errors.push({ phone, error: error.message });
      results.skipped++;
    }
  }

  res.status(201).json({
    success: true,
    message: `Bulk upload completed. Created: ${results.created}, Skipped: ${results.skipped}`,
    data: results
  });
});

// @desc    Get all leads with filtering and pagination
// @route   GET /api/admin/sales/leads
// @access  Private (Admin/HR only)
const getAllLeads = asyncHandler(async (req, res, next) => {
  const { 
    status, 
    category, 
    assignedTo, 
    priority, 
    search, 
    page = 1, 
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  let filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (assignedTo && assignedTo !== 'all') {
    if (assignedTo === 'unassigned') {
      filter.assignedTo = null;
    } else if (assignedTo === 'assigned') {
      filter.assignedTo = { $ne: null }; // Not null = assigned
    } else {
      filter.assignedTo = assignedTo;
    }
  }

  if (priority && priority !== 'all') {
    filter.priority = priority;
  }

  if (search) {
    filter.$or = [
      { phone: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const leads = await Lead.find(filter)
    .populate('category', 'name color icon')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name')
    .populate('leadProfile', 'name businessName email conversionData estimatedCost')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum);

  const totalLeads = await Lead.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: leads.length,
    total: totalLeads,
    page: pageNum,
    pages: Math.ceil(totalLeads / limitNum),
    data: leads
  });
});

// @desc    Get single lead
// @route   GET /api/admin/sales/leads/:id
// @access  Private (Admin/HR only)
const getLeadById = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id)
    .populate('category', 'name color icon')
    .populate('assignedTo', 'name email phone')
    .populate('createdBy', 'name');

  if (!lead) {
    return next(new ErrorResponse('Lead not found', 404));
  }

  res.status(200).json({
    success: true,
    data: lead
  });
});

// @desc    Update lead
// @route   PUT /api/admin/sales/leads/:id
// @access  Private (Admin/HR only)
const updateLead = asyncHandler(async (req, res, next) => {
  const { name, company, email, status, priority, category, value, notes, assignedTo } = req.body;

  let lead = await Lead.findById(req.params.id);

  if (!lead) {
    return next(new ErrorResponse('Lead not found', 404));
  }

  // Update fields
  if (name !== undefined) lead.name = name;
  if (company !== undefined) lead.company = company;
  if (email !== undefined) lead.email = email;
  if (status !== undefined) lead.status = status;
  if (priority !== undefined) lead.priority = priority;
  if (category !== undefined) lead.category = category;
  if (value !== undefined) lead.value = value;
  if (notes !== undefined) lead.notes = notes;
  if (assignedTo !== undefined) lead.assignedTo = assignedTo;

  // Update last contact date if status changed
  if (status && ['connected', 'hot', 'converted'].includes(status)) {
    lead.lastContactDate = new Date();
  }

  await lead.save();

  await lead.populate('category', 'name color icon');
  await lead.populate('assignedTo', 'name email');
  await lead.populate('createdBy', 'name');

  res.status(200).json({
    success: true,
    message: 'Lead updated successfully',
    data: lead
  });
});

// @desc    Delete lead
// @route   DELETE /api/admin/sales/leads/:id
// @access  Private (Admin/HR only)
const deleteLead = asyncHandler(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    return next(new ErrorResponse('Lead not found', 404));
  }

  await Lead.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Lead deleted successfully'
  });
});

// @desc    Get lead statistics
// @route   GET /api/admin/sales/leads/statistics
// @access  Private (Admin/HR only)
const getLeadStatistics = asyncHandler(async (req, res, next) => {
  const { period = 'all' } = req.query;

  let dateFilter = {};
  if (period !== 'all') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    if (startDate) {
      dateFilter.createdAt = { $gte: startDate };
    }
  }

  const stats = await Lead.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        newLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
        },
        connectedLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'connected'] }, 1, 0] }
        },
        hotLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'hot'] }, 1, 0] }
        },
        convertedLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
        },
        lostLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] }
        },
        totalValue: { $sum: '$value' },
        convertedValue: {
          $sum: { $cond: [{ $eq: ['$status', 'converted'] }, '$value', 0] }
        },
        assignedLeads: {
          $sum: { $cond: [{ $ne: ['$assignedTo', null] }, 1, 0] }
        },
        unassignedLeads: {
          $sum: { $cond: [{ $eq: ['$assignedTo', null] }, 1, 0] }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalLeads: 0,
    newLeads: 0,
    connectedLeads: 0,
    hotLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    totalValue: 0,
    convertedValue: 0,
    assignedLeads: 0,
    unassignedLeads: 0
  };

  // Calculate conversion rate
  result.conversionRate = result.totalLeads > 0 ? 
    (result.convertedLeads / result.totalLeads) * 100 : 0;

  // Calculate average deal value
  result.averageDealValue = result.convertedLeads > 0 ? 
    result.convertedValue / result.convertedLeads : 0;

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Create lead category
// @route   POST /api/admin/sales/categories
// @access  Private (Admin/HR only)
const createLeadCategory = asyncHandler(async (req, res, next) => {
  const { name, description, color, icon } = req.body;

  if (!name || !color) {
    return next(new ErrorResponse('Name and color are required', 400));
  }

  // Check if category with same name already exists
  const existingCategory = await LeadCategory.findOne({ name });
  if (existingCategory) {
    return next(new ErrorResponse('Category with this name already exists', 400));
  }

  const category = await LeadCategory.create({
    name,
    description,
    color,
    icon,
    createdBy: req.admin.id
  });

  await category.populate('createdBy', 'name');

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

// @desc    Get all lead categories
// @route   GET /api/admin/sales/categories
// @access  Private (Admin/HR only)
const getAllLeadCategories = asyncHandler(async (req, res, next) => {
  const categories = await LeadCategory.find()
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  // Get lead counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const leadCount = await Lead.countDocuments({ category: category._id });
      const activeLeadCount = await Lead.countDocuments({ 
        category: category._id, 
        status: { $in: ['new', 'connected', 'hot'] } 
      });
      const convertedLeadCount = await Lead.countDocuments({ 
        category: category._id, 
        status: 'converted' 
      });

      return {
        ...category.toObject(),
        leadCount,
        activeLeadCount,
        convertedLeadCount,
        conversionRate: leadCount > 0 ? (convertedLeadCount / leadCount) * 100 : 0
      };
    })
  );

  res.status(200).json({
    success: true,
    count: categoriesWithCounts.length,
    data: categoriesWithCounts
  });
});

// @desc    Get single lead category
// @route   GET /api/admin/sales/categories/:id
// @access  Private (Admin/HR only)
const getLeadCategoryById = asyncHandler(async (req, res, next) => {
  const category = await LeadCategory.findById(req.params.id)
    .populate('createdBy', 'name');

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  // Get performance data
  const performance = await category.getPerformance();

  res.status(200).json({
    success: true,
    data: {
      ...category.toObject(),
      performance
    }
  });
});

// @desc    Update lead category
// @route   PUT /api/admin/sales/categories/:id
// @access  Private (Admin/HR only)
const updateLeadCategory = asyncHandler(async (req, res, next) => {
  const { name, description, color, icon } = req.body;

  let category = await LeadCategory.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  // Check if new name conflicts with existing category
  if (name && name !== category.name) {
    const existingCategory = await LeadCategory.findOne({ name });
    if (existingCategory) {
      return next(new ErrorResponse('Category with this name already exists', 400));
    }
  }

  // Update fields
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (color !== undefined) category.color = color;
  if (icon !== undefined) category.icon = icon;

  await category.save();

  await category.populate('createdBy', 'name');

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category
  });
});

// @desc    Delete lead category
// @route   DELETE /api/admin/sales/categories/:id
// @access  Private (Admin/HR only)
const deleteLeadCategory = asyncHandler(async (req, res, next) => {
  const category = await LeadCategory.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  // Check if category has leads
  const leadCount = await Lead.countDocuments({ category: category._id });
  if (leadCount > 0) {
    return next(new ErrorResponse(`Cannot delete category "${category.name}" because it has ${leadCount} associated leads. Please reassign or delete the leads first.`, 400));
  }

  await LeadCategory.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// @desc    Get category performance
// @route   GET /api/admin/sales/categories/performance
// @access  Private (Admin/HR only)
const getCategoryPerformance = asyncHandler(async (req, res, next) => {
  const stats = await LeadCategory.getCategoryStatistics();

  res.status(200).json({
    success: true,
    count: stats.length,
    data: stats
  });
});

// @desc    Get all sales team members
// @route   GET /api/admin/sales/team
// @access  Private (Admin/HR only)
const getAllSalesTeam = asyncHandler(async (req, res, next) => {
  const salesTeam = await Sales.find({ isActive: true })
    .select('-password -loginAttempts -lockUntil')
    .sort({ name: 1 });

  // Get performance metrics for each team member
  const teamWithPerformance = await Promise.all(
    salesTeam.map(async (member) => {
      const leadStats = await Lead.aggregate([
        { $match: { assignedTo: member._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' }
          }
        }
      ]);

      const totalLeads = leadStats.reduce((sum, stat) => sum + stat.count, 0);
      const convertedLeads = leadStats.find(stat => stat._id === 'converted')?.count || 0;
      const totalValue = leadStats.reduce((sum, stat) => sum + stat.totalValue, 0);
      const convertedValue = leadStats.find(stat => stat._id === 'converted')?.totalValue || 0;

      return {
        ...member.toObject(),
        performance: {
          totalLeads,
          convertedLeads,
          conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
          totalValue,
          convertedValue,
          targetAchievement: member.salesTarget > 0 ? 
            (member.currentSales / member.salesTarget) * 100 : 0
        }
      };
    })
  );

  res.status(200).json({
    success: true,
    count: teamWithPerformance.length,
    data: teamWithPerformance
  });
});

// @desc    Get sales team member details
// @route   GET /api/admin/sales/team/:id
// @access  Private (Admin/HR only)
const getSalesTeamMember = asyncHandler(async (req, res, next) => {
  const member = await Sales.findById(req.params.id)
    .select('-password -loginAttempts -lockUntil');

  if (!member) {
    return next(new ErrorResponse('Sales team member not found', 404));
  }

  // Recalculate currentIncentive from conversion-based incentives
  try {
    await member.updateCurrentIncentive();
    // Reload member to get updated currentIncentive
    await member.save();
  } catch (error) {
    console.error('Error updating currentIncentive:', error);
    // Continue even if update fails
  }

  // Get detailed lead breakdown
  const leadBreakdown = await Lead.aggregate([
    { $match: { assignedTo: member._id } },
    {
      $group: {
        _id: {
          status: '$status',
          category: '$category'
        },
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    },
    {
      $lookup: {
        from: 'leadcategories',
        localField: '_id.category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $group: {
        _id: '$_id.status',
        count: { $sum: '$count' },
        totalValue: { $sum: '$totalValue' },
        categories: {
          $push: {
            categoryName: '$category.name',
            categoryColor: '$category.color',
            count: '$count',
            value: '$totalValue'
          }
        }
      }
    }
  ]);

  // Get conversion-based incentive history only
  const incentiveHistory = await Incentive.find({ 
    salesEmployee: member._id,
    isConversionBased: true
  })
    .populate('clientId', 'name')
    .populate('projectId', 'name status financialDetails')
    .populate('leadId', 'phone')
    .sort({ dateAwarded: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      ...member.toObject(),
      leadBreakdown,
      incentiveHistory
    }
  });
});

// @desc    Set sales target
// @route   PUT /api/admin/sales/team/:id/target
// @access  Private (Admin/HR only)
const setSalesTarget = asyncHandler(async (req, res, next) => {
  const { target } = req.body;

  if (!target || target < 0) {
    return next(new ErrorResponse('Valid target amount is required', 400));
  }

  const member = await Sales.findById(req.params.id);

  if (!member) {
    return next(new ErrorResponse('Sales team member not found', 404));
  }

  member.salesTarget = target;
  await member.save();

  res.status(200).json({
    success: true,
    message: 'Sales target updated successfully',
    data: {
      id: member._id,
      name: member.name,
      salesTarget: member.salesTarget
    }
  });
});

// @desc    Distribute leads to sales member
// @route   POST /api/admin/sales/team/:id/distribute-leads
// @access  Private (Admin/HR only)
const distributeLeads = asyncHandler(async (req, res, next) => {
  const { count, categoryId } = req.body;

  if (!count || count <= 0) {
    return next(new ErrorResponse('Valid lead count is required', 400));
  }

  const member = await Sales.findById(req.params.id);

  if (!member) {
    return next(new ErrorResponse('Sales team member not found', 404));
  }

  // Build filter for unassigned leads
  let filter = { assignedTo: null };
  if (categoryId && categoryId !== 'all') {
    filter.category = categoryId;
  }

  // Get unassigned leads
  const unassignedLeads = await Lead.find(filter)
    .sort({ createdAt: 1 })
    .limit(count);

  if (unassignedLeads.length === 0) {
    return next(new ErrorResponse('No unassigned leads available for distribution', 400));
  }

  // Assign leads to member
  const leadIds = unassignedLeads.map(lead => lead._id);
  
  await Lead.updateMany(
    { _id: { $in: leadIds } },
    { 
      assignedTo: member._id,
      lastContactDate: new Date()
    }
  );

  // Update member's leadsManaged array
  member.leadsManaged.push(...leadIds);
  await member.save();

  res.status(200).json({
    success: true,
    message: `${unassignedLeads.length} leads distributed successfully`,
    data: {
      memberId: member._id,
      memberName: member.name,
      leadsDistributed: unassignedLeads.length,
      leadIds
    }
  });
});

// @desc    Get leads for member
// @route   GET /api/admin/sales/team/:id/leads
// @access  Private (Admin/HR only)
const getLeadsForMember = asyncHandler(async (req, res, next) => {
  const { status, priority, page = 1, limit = 12 } = req.query;

  let filter = { assignedTo: req.params.id };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (priority && priority !== 'all') {
    filter.priority = priority;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const leads = await Lead.find(filter)
    .populate('category', 'name color icon')
    .populate('leadProfile', 'name businessName email conversionData estimatedCost')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalLeads = await Lead.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: leads.length,
    total: totalLeads,
    page: pageNum,
    pages: Math.ceil(totalLeads / limitNum),
    data: leads
  });
});

// @desc    Get leads by category for member
// @route   GET /api/admin/sales/team/:id/leads/category/:categoryId
// @access  Private (Admin/HR only)
const getLeadsByCategory = asyncHandler(async (req, res, next) => {
  const { status, priority, page = 1, limit = 12 } = req.query;

  let filter = { 
    assignedTo: req.params.id,
    category: req.params.categoryId
  };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (priority && priority !== 'all') {
    filter.priority = priority;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const leads = await Lead.find(filter)
    .populate('category', 'name color icon')
    .populate('leadProfile', 'name businessName email conversionData estimatedCost')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalLeads = await Lead.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: leads.length,
    total: totalLeads,
    page: pageNum,
    pages: Math.ceil(totalLeads / limitNum),
    data: leads
  });
});

// @desc    Set per-conversion incentive amount for sales member
// @route   POST /api/admin/sales/team/:id/incentive
// @access  Private (Admin/HR only)
const setIncentive = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return next(new ErrorResponse('Valid incentive amount is required', 400));
  }

  const member = await Sales.findById(req.params.id);

  if (!member) {
    return next(new ErrorResponse('Sales team member not found', 404));
  }

  // Update the per-conversion incentive amount (applies to future conversions only)
  const updatedMember = await Sales.findByIdAndUpdate(
    req.params.id,
    { incentivePerClient: amount },
    { new: true, runValidators: true }
  ).select('name email incentivePerClient');

  res.status(200).json({
    success: true,
    message: 'Per-conversion incentive amount set successfully',
    data: {
      member: updatedMember,
      incentivePerClient: amount,
      note: 'This amount will be applied to future lead conversions only'
    }
  });
});

// @desc    Get incentive history for member
// @route   GET /api/admin/sales/team/:id/incentives
// @access  Private (Admin/HR only)
const getIncentiveHistory = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  let filter = { salesEmployee: req.params.id };

  if (status && status !== 'all') {
    filter.status = status;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const incentives = await Incentive.find(filter)
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .sort({ dateAwarded: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalIncentives = await Incentive.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: incentives.length,
    total: totalIncentives,
    page: pageNum,
    pages: Math.ceil(totalIncentives / limitNum),
    data: incentives
  });
});

// @desc    Update incentive record
// @route   PUT /api/admin/sales/team/:id/incentive/:incentiveId
// @access  Private (Admin/HR only)
const updateIncentiveRecord = asyncHandler(async (req, res, next) => {
  const { status, reason, description } = req.body;

  const incentive = await Incentive.findById(req.params.incentiveId);

  if (!incentive) {
    return next(new ErrorResponse('Incentive record not found', 404));
  }

  if (incentive.salesEmployee.toString() !== req.params.id) {
    return next(new ErrorResponse('Incentive does not belong to this sales member', 400));
  }

  // Store previous status for transaction creation
  const previousStatus = incentive.status;

  // Update fields
  if (status !== undefined) {
    if (status === 'approved' && incentive.status === 'pending') {
      await incentive.approve(req.admin.id);
    } else if (status === 'paid' && incentive.status === 'approved') {
      await incentive.markAsPaid();
      
      // Create finance transaction when incentive is marked as paid
      try {
        const { createOutgoingTransaction } = require('../utils/financeTransactionHelper');
        
        if (previousStatus !== 'paid') {
          await createOutgoingTransaction({
            amount: incentive.amount,
            category: 'Sales Incentive',
            transactionDate: incentive.paidAt || new Date(),
            createdBy: req.admin.id,
            employee: incentive.salesEmployee, // Sales model reference
            description: `Sales incentive: ${incentive.reason}`,
            metadata: {
              sourceType: 'incentive',
              sourceId: incentive._id.toString()
            },
            checkDuplicate: true
          });
        }
      } catch (error) {
        // Log error but don't fail the incentive update
        console.error('Error creating finance transaction for incentive:', error);
      }
    } else {
      incentive.status = status;
    }
  }

  if (reason !== undefined) incentive.reason = reason;
  if (description !== undefined) incentive.description = description;

  await incentive.save();

  await incentive.populate('createdBy', 'name');
  await incentive.populate('approvedBy', 'name');

  res.status(200).json({
    success: true,
    message: 'Incentive record updated successfully',
    data: incentive
  });
});

// @desc    Get sales overview
// @route   GET /api/admin/sales/overview
// @access  Private (Admin/HR only)
const getSalesOverview = asyncHandler(async (req, res, next) => {
  const { period = 'all' } = req.query;

  let dateFilter = {};
  if (period !== 'all') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    if (startDate) {
      dateFilter.createdAt = { $gte: startDate };
    }
  }

  // Get lead statistics
  const leadStats = await Lead.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        unassignedLeads: { $sum: { $cond: [{ $eq: ['$assignedTo', null] }, 1, 0] } },
        assignedLeads: { $sum: { $cond: [{ $ne: ['$assignedTo', null] }, 1, 0] } },
        newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        connectedLeads: { $sum: { $cond: [{ $eq: ['$status', 'connected'] }, 1, 0] } },
        hotLeads: { $sum: { $cond: [{ $eq: ['$status', 'hot'] }, 1, 0] } },
        convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
        lostLeads: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
        totalValue: { $sum: '$value' },
        convertedValue: {
          $sum: { $cond: [{ $eq: ['$status', 'converted'] }, '$value', 0] }
        }
      }
    }
  ]);

  // Get today's new leads specifically
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayLeadsStats = await Lead.aggregate([
    { 
      $match: { 
        createdAt: { $gte: todayStart, $lte: todayEnd },
        status: 'new'
      } 
    },
    {
      $group: {
        _id: null,
        todayNewLeads: { $sum: 1 }
      }
    }
  ]);

  // Get sales team statistics
  const teamStats = await Sales.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalTeamMembers: { $sum: 1 },
        totalTarget: { $sum: '$salesTarget' },
        totalCurrentSales: { $sum: '$currentSales' },
        totalIncentive: { $sum: '$currentIncentive' }
      }
    }
  ]);

  // Alternative simple count for debugging
  const salesCount = await Sales.countDocuments({ isActive: true });

  // Get client statistics
  const clientStats = await Client.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalClients: { $sum: 1 },
        totalSpent: { $sum: '$totalSpent' },
        activeClients: { 
          $sum: { 
            $cond: [
              { $gte: ['$lastActivity', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }, 
              1, 
              0
            ] 
          } 
        }
      }
    }
  ]);

  // Get incentive statistics
  const incentiveStats = await Incentive.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const leadData = leadStats[0] || {
    totalLeads: 0,
    unassignedLeads: 0,
    assignedLeads: 0,
    newLeads: 0,
    connectedLeads: 0,
    hotLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    totalValue: 0,
    convertedValue: 0
  };

  const todayLeadsData = todayLeadsStats[0] || {
    todayNewLeads: 0
  };

  const teamData = teamStats[0] || {
    totalTeamMembers: salesCount, // Use simple count as fallback
    totalTarget: 0,
    totalCurrentSales: 0,
    totalIncentive: 0
  };

  const clientData = clientStats[0] || {
    totalClients: 0,
    totalSpent: 0,
    activeClients: 0
  };

  const overview = {
    leads: {
      total: leadData.totalLeads,
      unassigned: leadData.unassignedLeads,
      assigned: leadData.assignedLeads,
      new: todayLeadsData.todayNewLeads, // Today's new leads
      connected: leadData.connectedLeads,
      hot: leadData.hotLeads,
      converted: leadData.convertedLeads,
      lost: leadData.lostLeads,
      conversionRate: leadData.totalLeads > 0 ? 
        (leadData.convertedLeads / leadData.totalLeads) * 100 : 0,
      totalValue: leadData.totalValue,
      convertedValue: leadData.convertedValue,
      averageDealValue: leadData.convertedLeads > 0 ? 
        leadData.convertedValue / leadData.convertedLeads : 0
    },
    team: {
      total: teamData.totalTeamMembers,
      totalTarget: teamData.totalTarget,
      totalCurrentSales: teamData.totalCurrentSales,
      targetAchievement: teamData.totalTarget > 0 ? 
        (teamData.totalCurrentSales / teamData.totalTarget) * 100 : 0,
      totalIncentive: teamData.totalIncentive,
      performance: teamData.totalTarget > 0 ? 
        (teamData.totalCurrentSales / teamData.totalTarget) * 100 : 0
    },
    clients: {
      total: clientData.totalClients,
      totalSpent: clientData.totalSpent,
      retention: clientData.totalClients > 0 ? 
        (clientData.activeClients / clientData.totalClients) * 100 : 0
    },
    incentives: {
      pending: incentiveStats.find(s => s._id === 'pending')?.count || 0,
      approved: incentiveStats.find(s => s._id === 'approved')?.count || 0,
      paid: incentiveStats.find(s => s._id === 'paid')?.count || 0,
      totalAmount: incentiveStats.reduce((sum, s) => sum + s.totalAmount, 0)
    }
  };

  res.status(200).json({
    success: true,
    data: overview
  });
});

// @desc    Get category analytics
// @route   GET /api/admin/sales/analytics/categories
// @access  Private (Admin/HR only)
const getCategoryAnalytics = asyncHandler(async (req, res, next) => {
  const stats = await LeadCategory.getCategoryStatistics();

  res.status(200).json({
    success: true,
    count: stats.length,
    data: stats
  });
});

// @desc    Get team performance analytics
// @route   GET /api/admin/sales/analytics/team
// @access  Private (Admin/HR only)
const getTeamPerformance = asyncHandler(async (req, res, next) => {
  const salesTeam = await Sales.find({ isActive: true })
    .select('name email salesTarget currentSales currentIncentive');

  const teamPerformance = await Promise.all(
    salesTeam.map(async (member) => {
      const leadStats = await Lead.aggregate([
        { $match: { assignedTo: member._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' }
          }
        }
      ]);

      const totalLeads = leadStats.reduce((sum, stat) => sum + stat.count, 0);
      const convertedLeads = leadStats.find(stat => stat._id === 'converted')?.count || 0;
      const totalValue = leadStats.reduce((sum, stat) => sum + stat.totalValue, 0);
      const convertedValue = leadStats.find(stat => stat._id === 'converted')?.totalValue || 0;

      return {
        id: member._id,
        name: member.name,
        email: member.email,
        salesTarget: member.salesTarget,
        currentSales: member.currentSales,
        currentIncentive: member.currentIncentive,
        performance: {
          totalLeads,
          convertedLeads,
          conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
          totalValue,
          convertedValue,
          targetAchievement: member.salesTarget > 0 ? 
            (member.currentSales / member.salesTarget) * 100 : 0,
          performanceScore: calculatePerformanceScore(
            totalLeads,
            convertedLeads,
            member.salesTarget,
            member.currentSales
          )
        }
      };
    })
  );

  // Sort by performance score
  teamPerformance.sort((a, b) => b.performance.performanceScore - a.performance.performanceScore);

  res.status(200).json({
    success: true,
    count: teamPerformance.length,
    data: teamPerformance
  });
});

// Helper function to calculate performance score
const calculatePerformanceScore = (totalLeads, convertedLeads, target, currentSales) => {
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const targetAchievement = target > 0 ? (currentSales / target) * 100 : 0;
  
  // Weighted score: 40% conversion rate + 60% target achievement
  return Math.round((conversionRate * 0.4) + (targetAchievement * 0.6));
};

// @desc    Delete sales team member
// @route   DELETE /api/admin/sales/team/:id
// @access  Private (Admin/HR only)
const deleteSalesMember = asyncHandler(async (req, res, next) => {
  const member = await Sales.findById(req.params.id);

  if (!member) {
    return next(new ErrorResponse('Sales team member not found', 404));
  }

  // Check if member has assigned leads
  const assignedLeadsCount = await Lead.countDocuments({ assignedTo: member._id });
  
  if (assignedLeadsCount > 0) {
    return next(new ErrorResponse(`Cannot delete sales team member "${member.name}" because they have ${assignedLeadsCount} assigned leads. Please reassign or delete the leads first.`, 400));
  }

  await Sales.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Sales team member deleted successfully'
  });
});

module.exports = {
  // Lead Management
  createLead,
  createBulkLeads,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getLeadStatistics,

  // Lead Category Management
  createLeadCategory,
  getAllLeadCategories,
  getLeadCategoryById,
  updateLeadCategory,
  deleteLeadCategory,
  getCategoryPerformance,

  // Sales Team Management
  getAllSalesTeam,
  getSalesTeamMember,
  setSalesTarget,
  distributeLeads,
  getLeadsForMember,
  getLeadsByCategory,
  deleteSalesMember,

  // Incentive Management
  setIncentive,
  getIncentiveHistory,
  updateIncentiveRecord,

  // Analytics
  getSalesOverview,
  getCategoryAnalytics,
  getTeamPerformance
};
