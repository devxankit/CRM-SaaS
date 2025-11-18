const Request = require('../models/Request');
const Project = require('../models/Project');
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const Employee = require('../models/Employee');
const PM = require('../models/PM');
const Sales = require('../models/Sales');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Helper to get user info from request (works for all user types)
const getUserInfo = (req) => {
  if (req.admin) {
    return { id: req.admin.id, model: 'Admin', module: 'admin' };
  } else if (req.client) {
    return { id: req.client.id, model: 'Client', module: 'client' };
  } else if (req.employee) {
    return { id: req.employee.id, model: 'Employee', module: 'employee' };
  } else if (req.pm) {
    return { id: req.pm.id, model: 'PM', module: 'pm' };
  } else if (req.sales) {
    return { id: req.sales.id, model: 'Sales', module: 'sales' };
  }
  return null;
};

// Helper to populate request with user details
const populateRequest = async (request) => {
  await request.populate([
    { path: 'requestedBy', select: 'name email phoneNumber' },
    { path: 'recipient', select: 'name email phoneNumber' },
    { path: 'project', select: 'name status' },
    { path: 'client', select: 'name email phoneNumber' }
  ]);
  
  if (request.response && request.response.respondedBy) {
    // Populate respondedBy based on model
    const modelMap = {
      'Admin': Admin,
      'Client': Client,
      'Employee': Employee,
      'PM': PM,
      'Sales': Sales
    };
    const Model = modelMap[request.response.respondedByModel];
    if (Model && request.response.respondedBy) {
      const responder = await Model.findById(request.response.respondedBy).select('name email');
      if (responder) {
        request.response.respondedBy = responder;
      }
    }
  }
  
  return request;
};

// @desc    Create a new request
// @route   POST /api/requests
// @access  Private (All authenticated users)
const createRequest = asyncHandler(async (req, res, next) => {
  const user = getUserInfo(req);
  if (!user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const { title, description, type, priority, recipient, recipientModel, project, client, category, amount } = req.body;

  // Validation
  if (!title || !description || !type || !recipient || !recipientModel) {
    return next(new ErrorResponse('Title, description, type, recipient, and recipientModel are required', 400));
  }

  // Validate recipient model
  if (!['Admin', 'Client', 'Employee', 'PM', 'Sales'].includes(recipientModel)) {
    return next(new ErrorResponse('Invalid recipient model', 400));
  }

  // Validate recipient exists
  const modelMap = {
    'Admin': Admin,
    'Client': Client,
    'Employee': Employee,
    'PM': PM,
    'Sales': Sales
  };
  const RecipientModel = modelMap[recipientModel];
  if (!RecipientModel) {
    return next(new ErrorResponse('Invalid recipient model', 400));
  }

  const recipientExists = await RecipientModel.findById(recipient);
  if (!recipientExists) {
    return next(new ErrorResponse('Recipient not found', 404));
  }

  // Validate project if provided
  if (project) {
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return next(new ErrorResponse('Project not found', 404));
    }
  }

  // Validate client if provided
  if (client) {
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return next(new ErrorResponse('Client not found', 404));
    }
  }

  // Validate amount for payment-recovery type
  if (type === 'payment-recovery' && (!amount || amount <= 0)) {
    return next(new ErrorResponse('Amount is required for payment-recovery requests', 400));
  }

  // Create request
  const request = await Request.create({
    module: user.module,
    type,
    title,
    description,
    category: category || '',
    priority: priority || 'normal',
    requestedBy: user.id,
    requestedByModel: user.model,
    recipient,
    recipientModel,
    project: project || undefined,
    client: client || undefined,
    amount: type === 'payment-recovery' ? amount : undefined,
    status: 'pending'
  });

  await populateRequest(request);

  res.status(201).json({
    success: true,
    message: 'Request created successfully',
    data: request
  });
});

// @desc    Get all requests (incoming/outgoing with filters)
// @route   GET /api/requests
// @access  Private (All authenticated users)
const getRequests = asyncHandler(async (req, res, next) => {
  const user = getUserInfo(req);
  if (!user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const {
    direction = 'all', // 'incoming', 'outgoing', or 'all'
    module,
    type,
    status,
    priority,
    search,
    page = 1,
    limit = 20
  } = req.query;

  // Build filter
  const filter = {};

  // Filter by direction
  if (direction === 'incoming') {
    filter.recipient = user.id;
    filter.recipientModel = user.model;
  } else if (direction === 'outgoing') {
    filter.requestedBy = user.id;
    filter.requestedByModel = user.model;
  } else {
    // All requests where user is either sender or recipient
    filter.$or = [
      { requestedBy: user.id, requestedByModel: user.model },
      { recipient: user.id, recipientModel: user.model }
    ];
  }

  // Additional filters
  if (module) filter.module = module;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // Search filter
  if (search) {
    filter.$or = [
      ...(filter.$or || []),
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const requests = await Request.find(filter)
    .populate('requestedBy', 'name email phoneNumber')
    .populate('recipient', 'name email phoneNumber')
    .populate('project', 'name status')
    .populate('client', 'name email phoneNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Populate response.respondedBy
  for (let request of requests) {
    if (request.response && request.response.respondedBy && request.response.respondedByModel) {
      const modelMap = {
        'Admin': Admin,
        'Client': Client,
        'Employee': Employee,
        'PM': PM,
        'Sales': Sales
      };
      const Model = modelMap[request.response.respondedByModel];
      if (Model) {
        const responder = await Model.findById(request.response.respondedBy).select('name email');
        if (responder) {
          request.response.respondedBy = responder;
        }
      }
    }
  }

  const total = await Request.countDocuments(filter);

  res.json({
    success: true,
    message: 'Requests fetched successfully',
    data: requests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get request by ID
// @route   GET /api/requests/:id
// @access  Private (All authenticated users - must be sender or recipient)
const getRequestById = asyncHandler(async (req, res, next) => {
  const user = getUserInfo(req);
  if (!user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse('Request not found', 404));
  }

  // Check if user is sender or recipient
  const isSender = String(request.requestedBy) === String(user.id) && request.requestedByModel === user.model;
  const isRecipient = String(request.recipient) === String(user.id) && request.recipientModel === user.model;

  if (!isSender && !isRecipient) {
    return next(new ErrorResponse('Not authorized to access this request', 403));
  }

  await populateRequest(request);

  res.json({
    success: true,
    message: 'Request fetched successfully',
    data: request
  });
});

// @desc    Respond to request
// @route   POST /api/requests/:id/respond
// @access  Private (Recipient only)
const respondToRequest = asyncHandler(async (req, res, next) => {
  const user = getUserInfo(req);
  if (!user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const { responseType, message } = req.body;

  if (!responseType || !['approve', 'reject', 'request_changes'].includes(responseType)) {
    return next(new ErrorResponse('Valid response type (approve/reject/request_changes) is required', 400));
  }

  // For approve, message is optional; for reject/request_changes, message is required
  if (responseType !== 'approve' && !message) {
    return next(new ErrorResponse('Message is required for reject and request_changes responses', 400));
  }

  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse('Request not found', 404));
  }

  // Check if user is the recipient
  const isRecipient = String(request.recipient) === String(user.id) && request.recipientModel === user.model;

  if (!isRecipient) {
    return next(new ErrorResponse('Only the recipient can respond to this request', 403));
  }

  // Check if request is already responded
  if (request.status !== 'pending') {
    return next(new ErrorResponse('Request has already been responded to', 400));
  }

  // Handle installment payment approval - update installment status if approved
  if (request.type === 'approval' && request.module === 'sales' && request.metadata?.installmentId) {
    if (responseType === 'approve') {
      // Update installment status to paid
      const project = await Project.findById(request.metadata.projectId);
      if (!project) {
        return next(new ErrorResponse('Project not found', 404));
      }

      const installment = project.installmentPlan?.id(request.metadata.installmentId);
      if (!installment) {
        return next(new ErrorResponse('Installment not found', 404));
      }

      // Check if already paid
      if (installment.status === 'paid') {
        return next(new ErrorResponse('Installment is already marked as paid', 400));
      }

      // Mark installment as paid
      const previousStatus = installment.status;
      installment.status = 'paid';
      installment.paidDate = request.metadata.paidDate ? new Date(request.metadata.paidDate) : new Date();
      if (request.metadata.notes) {
        installment.notes = request.metadata.notes;
      }

      // Create incoming transaction when installment is marked as paid
      if (previousStatus !== 'paid') {
        try {
          const { createIncomingTransaction } = require('../utils/financeTransactionHelper');
          const Admin = require('../models/Admin');
          
          let adminId = user.id;
          if (!adminId) {
            const admin = await Admin.findOne({ isActive: true }).select('_id');
            adminId = admin ? admin._id : null;
          }

          if (adminId) {
            await createIncomingTransaction({
              amount: installment.amount,
              category: 'Project Installment Payment',
              transactionDate: installment.paidDate,
              createdBy: adminId,
              client: project.client,
              project: project._id,
              description: `Installment payment for project "${project.name}" - ₹${installment.amount}`,
              metadata: {
                sourceType: 'projectInstallment',
                sourceId: installment._id.toString(),
                projectId: project._id.toString(),
                installmentId: installment._id.toString()
              },
              checkDuplicate: true
            });
          }
        } catch (error) {
          console.error('Error creating finance transaction for installment:', error);
          // Don't fail the request approval if transaction creation fails
        }
      }

      // Recalculate project financials
      try {
        const { calculateInstallmentTotals, recalculateProjectFinancials, refreshInstallmentStatuses } = require('../utils/projectFinancialHelper');
        project.markModified('installmentPlan');
        refreshInstallmentStatuses(project);
        const totals = calculateInstallmentTotals(project.installmentPlan);
        await recalculateProjectFinancials(project, totals);
        await project.save();
      } catch (error) {
        console.error('Error recalculating project financials:', error);
        // Don't fail the request approval if recalculation fails
      }
    }
  }

  // Respond to request
  await request.respond(user.id, user.model, responseType, message || '');

  await populateRequest(request);

  res.json({
    success: true,
    message: 'Response submitted successfully',
    data: request
  });
});

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Private (Sender only, only pending requests)
const updateRequest = asyncHandler(async (req, res, next) => {
  const user = getUserInfo(req);
  if (!user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse('Request not found', 404));
  }

  // Check if user is the sender
  const isSender = String(request.requestedBy) === String(user.id) && request.requestedByModel === user.model;

  if (!isSender) {
    return next(new ErrorResponse('Only the sender can update this request', 403));
  }

  // Only allow updates to pending requests
  if (request.status !== 'pending') {
    return next(new ErrorResponse('Only pending requests can be updated', 400));
  }

  // Allowed fields to update
  const { title, description, priority, category, amount } = req.body;

  if (title) request.title = title;
  if (description) request.description = description;
  if (priority) request.priority = priority;
  if (category !== undefined) request.category = category;
  if (amount !== undefined && request.type === 'payment-recovery') {
    request.amount = amount;
  }

  await request.save();
  await populateRequest(request);

  res.json({
    success: true,
    message: 'Request updated successfully',
    data: request
  });
});

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private (Sender only, only pending requests)
const deleteRequest = asyncHandler(async (req, res, next) => {
  const user = getUserInfo(req);
  if (!user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse('Request not found', 404));
  }

  // Check if user is the sender
  const isSender = String(request.requestedBy) === String(user.id) && request.requestedByModel === user.model;

  if (!isSender) {
    return next(new ErrorResponse('Only the sender can delete this request', 403));
  }

  // Only allow deletion of pending requests
  if (request.status !== 'pending') {
    return next(new ErrorResponse('Only pending requests can be deleted', 400));
  }

  await request.deleteOne();

  res.json({
    success: true,
    message: 'Request deleted successfully'
  });
});

// @desc    Get request statistics
// @route   GET /api/requests/statistics
// @access  Private (All authenticated users)
const getRequestStatistics = asyncHandler(async (req, res, next) => {
  const user = getUserInfo(req);
  if (!user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const { direction = 'all' } = req.query;

  // Build filter
  const filter = {};

  if (direction === 'incoming') {
    filter.recipient = user.id;
    filter.recipientModel = user.model;
  } else if (direction === 'outgoing') {
    filter.requestedBy = user.id;
    filter.requestedByModel = user.model;
  } else {
    // All requests where user is either sender or recipient
    filter.$or = [
      { requestedBy: user.id, requestedByModel: user.model },
      { recipient: user.id, recipientModel: user.model }
    ];
  }

  // Get statistics
  const [
    totalRequests,
    pendingRequests,
    respondedRequests,
    approvedRequests,
    rejectedRequests,
    urgentRequests,
    clientRequests,
    employeeRequests,
    pmRequests,
    salesRequests,
    adminRequests
  ] = await Promise.all([
    Request.countDocuments(filter),
    Request.countDocuments({ ...filter, status: 'pending' }),
    Request.countDocuments({ ...filter, status: 'responded' }),
    Request.countDocuments({ ...filter, status: 'approved' }),
    Request.countDocuments({ ...filter, status: 'rejected' }),
    Request.countDocuments({ ...filter, priority: 'urgent', status: 'pending' }),
    Request.countDocuments({ ...filter, module: 'client' }),
    Request.countDocuments({ ...filter, module: 'employee' }),
    Request.countDocuments({ ...filter, module: 'pm' }),
    Request.countDocuments({ ...filter, module: 'sales' }),
    Request.countDocuments({ ...filter, module: 'admin' })
  ]);

  res.json({
    success: true,
    message: 'Statistics fetched successfully',
    data: {
      totalRequests,
      pendingRequests,
      respondedRequests,
      approvedRequests,
      rejectedRequests,
      urgentRequests,
      clientRequests,
      employeeRequests,
      pmRequests,
      salesRequests,
      adminRequests
    }
  });
});

// @desc    Get available recipients by type
// @route   GET /api/requests/recipients
// @access  Private (All authenticated users)
const getRecipients = asyncHandler(async (req, res, next) => {
  const user = getUserInfo(req);
  if (!user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const { type } = req.query; // 'client', 'employee', 'pm', 'sales', 'admin'

  if (!type || !['client', 'employee', 'pm', 'sales', 'admin'].includes(type)) {
    return next(new ErrorResponse('Valid recipient type is required', 400));
  }

  const modelMap = {
    'admin': Admin,
    'client': Client,
    'employee': Employee,
    'pm': PM,
    'sales': Sales
  };

  const Model = modelMap[type];
  if (!Model) {
    return next(new ErrorResponse('Invalid recipient type', 400));
  }

  const recipients = await Model.find({}).select('name email phoneNumber').limit(100);

  res.json({
    success: true,
    message: 'Recipients fetched successfully',
    data: recipients.map(r => ({
      id: r._id,
      name: r.name,
      email: r.email,
      phoneNumber: r.phoneNumber
    }))
  });
});

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  respondToRequest,
  updateRequest,
  deleteRequest,
  getRequestStatistics,
  getRecipients
};

