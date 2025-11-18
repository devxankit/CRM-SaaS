const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Sales = require('../models/Sales');
const Lead = require('../models/Lead');
const LeadCategory = require('../models/LeadCategory');
const Account = require('../models/Account');
const PaymentReceipt = require('../models/PaymentReceipt');
const SalesTask = require('../models/SalesTask');
const SalesMeeting = require('../models/SalesMeeting');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Request = require('../models/Request');
// Ensure LeadProfile model is registered before any populate calls
require('../models/LeadProfile');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    List active accounts for payments (sales read-only)
// @route   GET /api/sales/accounts
// @access  Private (Sales)
const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ isActive: true }).select('name bankName accountNumber ifsc upiId');
    res.json({ success: true, data: accounts, message: 'Accounts fetched' });
  } catch (error) {
    console.error('getAccounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch accounts' });
  }
};

// Helper to safely cast id
const safeObjectId = (value) => {
  try { return new mongoose.Types.ObjectId(value); } catch { return value; }
};

// Helper: build last N months labels (ending current month)
const getLastNMonths = (n) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), monthIndex: d.getMonth() + 1 });
  }
  return months;
};

// @desc    List receivables (projects for my converted clients) with filters
// @route   GET /api/sales/payment-recovery
// @access  Private (Sales)
const getPaymentRecovery = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const { search = '', overdue, band } = req.query;
    // Primary path: clients converted by me
    const clientMatch = { convertedBy: salesId };
    if (search) {
      clientMatch.$or = [
        { name: new RegExp(search, 'i') },
        { phoneNumber: new RegExp(search, 'i') }
      ];
    }
    const myClients = await Client.find(clientMatch).select('_id name phoneNumber');
    const clientIds = myClients.map(c => c._id);

    // Build project filter: include both clients converted by me and projects I submitted
    const projectFilter = {
      $or: [
        { client: { $in: clientIds } },
        { submittedBy: salesId }
      ]
    };
    if (overdue === 'true') {
      projectFilter.dueDate = { $lt: new Date() };
    }

    // Fetch projects and compute remaining based on financialDetails
    const projects = await Project.find(projectFilter)
      .select('client dueDate financialDetails')
      .populate('client', 'name phoneNumber');

    const bandFilter = (amount) => {
      if (!band) return true;
      if (band === 'high') return amount >= 10000;
      if (band === 'medium') return amount >= 3000 && amount < 10000;
      if (band === 'low') return amount < 3000;
      return true;
    };

    const list = projects
      .map(p => {
        const rem = (p.financialDetails?.remainingAmount || 0);
        return rem > 0 ? {
          projectId: p._id,
          clientId: p.client?._id,
          clientName: p.client?.name,
          phone: p.client?.phoneNumber,
          dueDate: p.dueDate,
          remainingAmount: rem
        } : null;
      })
      .filter(Boolean)
      .filter(r => bandFilter(r.remainingAmount));

    res.json({ success: true, data: list, message: 'Receivables fetched' });
  } catch (error) {
    console.error('getPaymentRecovery error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receivables' });
  }
};

// @desc    Summary stats for receivables
// @route   GET /api/sales/payment-recovery/stats
const getPaymentRecoveryStats = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    // Prefer clients converted by me; fallback to projects submitted by me
    const myClients = await Client.find({ convertedBy: salesId }).select('_id');
    const clientIds = myClients.map(c => c._id);
    const projectQuery = { $or: [ { client: { $in: clientIds } }, { submittedBy: salesId } ] };
    const projects = await Project.find(projectQuery).select('dueDate financialDetails');
    let totalDue = 0, overdueCount = 0, overdueAmount = 0;
    const now = new Date();
    projects.forEach(p => {
      const rem = p.financialDetails?.remainingAmount || 0;
      totalDue += rem;
      if (p.dueDate && p.dueDate < now && rem > 0) {
        overdueCount += 1;
        overdueAmount += rem;
      }
    });
    res.json({ success: true, data: { totalDue, overdueCount, overdueAmount }, message: 'Stats fetched' });
  } catch (error) {
    console.error('getPaymentRecoveryStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// @desc    Create payment receipt (pending verification)
// @route   POST /api/sales/payment-recovery/:projectId/receipts
const createPaymentReceipt = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const { projectId } = req.params;
    const { amount, accountId, method = 'upi', referenceId, notes } = req.body;

    if (!amount || !accountId) {
      return res.status(400).json({ success: false, message: 'Amount and account are required' });
    }

    const project = await Project.findById(projectId).populate('client');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // ensure client is converted by this sales user
    const client = await Client.findById(project.client);
    if (!client || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this client' });
    }

    const receipt = await PaymentReceipt.create({
      client: client._id,
      project: project._id,
      amount,
      account: accountId,
      method,
      referenceId,
      notes,
      createdBy: salesId,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: receipt, message: 'Receipt created and pending verification' });
  } catch (error) {
    console.error('createPaymentReceipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to create receipt' });
  }
};

// @desc    Get installments for a project
// @route   GET /api/sales/payment-recovery/:projectId/installments
// @access  Private (Sales)
const getProjectInstallments = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate('client');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify access - client must be converted by this sales person
    const client = await Client.findById(project.client);
    if (!client || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this project' });
    }

    // Get installments and check for pending approval requests
    const installments = project.installmentPlan || [];
    
    // Fetch pending approval requests for these installments
    const installmentIds = installments.map(inst => inst._id.toString());
    const pendingRequests = await Request.find({
      module: 'sales',
      type: 'approval',
      project: projectId,
      status: 'pending',
      'metadata.installmentId': { $in: installmentIds }
    }).select('metadata response');

    // Create a map of installmentId -> request status
    const requestMap = {};
    pendingRequests.forEach(req => {
      const instId = req.metadata?.installmentId;
      if (instId) {
        requestMap[instId] = {
          requestId: req._id,
          status: req.status,
          hasPendingRequest: true
        };
      }
    });

    // Format installments with request status
    const formattedInstallments = installments.map((inst, index) => ({
      _id: inst._id,
      id: inst._id,
      amount: inst.amount,
      dueDate: inst.dueDate,
      status: inst.status,
      paidDate: inst.paidDate,
      notes: inst.notes,
      index: index + 1,
      pendingApproval: requestMap[inst._id.toString()] || null
    }));

    res.json({ 
      success: true, 
      data: formattedInstallments, 
      message: 'Installments fetched successfully' 
    });
  } catch (error) {
    console.error('getProjectInstallments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch installments' });
  }
};

// @desc    Request approval to mark installment as paid
// @route   POST /api/sales/payment-recovery/:projectId/installments/:installmentId/request-payment
// @access  Private (Sales)
const requestInstallmentPayment = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const { projectId, installmentId } = req.params;
    const { paidDate, notes } = req.body;

    const project = await Project.findById(projectId).populate('client');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify access
    const client = await Client.findById(project.client);
    if (!client || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this project' });
    }

    // Find the installment
    const installment = project.installmentPlan?.id(installmentId);
    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }

    // Check if already paid
    if (installment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Installment is already marked as paid' });
    }

    // Check if there's already a pending request for this installment
    const existingRequest = await Request.findOne({
      module: 'sales',
      type: 'approval',
      project: projectId,
      status: 'pending',
      'metadata.installmentId': installmentId
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'A pending approval request already exists for this installment' 
      });
    }

    // Get first admin as recipient
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne({ isActive: true }).select('_id');
    if (!admin) {
      return res.status(500).json({ success: false, message: 'No admin found to approve the request' });
    }

    // Find installment index
    const installmentIndex = project.installmentPlan.findIndex(inst => String(inst._id) === String(installmentId)) + 1;

    // Create approval request
    const request = await Request.create({
      module: 'sales',
      type: 'approval',
      title: `Mark Installment as Paid - ₹${installment.amount}`,
      description: `Sales person requests to mark installment #${installmentIndex} (₹${installment.amount}) as paid for project "${project.name}".${notes ? ` Notes: ${notes}` : ''}`,
      priority: 'normal',
      requestedBy: salesId,
      requestedByModel: 'Sales',
      recipient: admin._id,
      recipientModel: 'Admin',
      project: projectId,
      client: client._id,
      amount: installment.amount,
      metadata: {
        installmentId: installmentId,
        projectId: projectId,
        paidDate: paidDate || new Date(),
        notes: notes || ''
      }
    });

    res.status(201).json({ 
      success: true, 
      data: request, 
      message: 'Payment approval request created successfully. Waiting for admin approval.' 
    });
  } catch (error) {
    console.error('requestInstallmentPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment request' });
  }
};

// Demo Requests
// @desc    List my demo requests stored on leads.demoRequest
// @route   GET /api/sales/demo-requests
const getDemoRequests = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const { search = '', status, category } = req.query;
    // Include leads marked via legacy status 'demo_requested' or with demoRequest subdoc
    const filter = { 
      assignedTo: salesId, 
      $or: [
        { 'demoRequest.status': { $exists: true } },
        { status: 'demo_requested' }
      ]
    };
    if (status && status !== 'all') filter['demoRequest.status'] = status;
    if (category && category !== 'all') filter.category = safeObjectId(category);
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { company: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
    let leads = await Lead.find(filter)
      .populate('category', 'name color icon')
      .populate('leadProfile', 'name businessName');
    // Normalize: if demoRequest missing but status is demo_requested, treat as pending
    leads = leads.map(l => {
      if (!l.demoRequest || !l.demoRequest.status) {
        if (l.status === 'demo_requested') {
          l = l.toObject();
          l.demoRequest = { status: 'pending' };
          return l;
        }
      }
      return l.toObject ? l.toObject() : l;
    });
    const stats = {
      total: leads.length,
      pending: leads.filter(l => l.demoRequest && l.demoRequest.status === 'pending').length,
      scheduled: leads.filter(l => l.demoRequest && l.demoRequest.status === 'scheduled').length,
      completed: leads.filter(l => l.demoRequest && l.demoRequest.status === 'completed').length
    };
    res.json({ success: true, data: { items: leads, stats }, message: 'Demo requests fetched' });
  } catch (error) {
    console.error('getDemoRequests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch demo requests' });
  }
};

// @desc    Update demo request status on a lead
// @route   PATCH /api/sales/demo-requests/:leadId/status
const updateDemoRequestStatus = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const { leadId } = req.params;
    const { status } = req.body; // 'pending' | 'scheduled' | 'completed' | 'cancelled'
    if (!['pending','scheduled','completed','cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const lead = await Lead.findOne({ _id: leadId, assignedTo: salesId });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    lead.demoRequest = { ...(lead.demoRequest||{}), status, updatedAt: new Date() };
    await lead.save();
    res.json({ success: true, data: lead, message: 'Demo status updated' });
  } catch (error) {
    console.error('updateDemoRequestStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update demo status' });
  }
};

// Sales Tasks CRUD
const listSalesTasks = async (req, res) => {
  try {
    const owner = safeObjectId(req.sales.id);
    const { search = '', filter = 'all' } = req.query;
    const q = { owner };
    if (search) {
      q.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }];
    }
    if (['pending','completed'].includes(filter)) q.completed = filter === 'completed';
    if (['high','medium','low'].includes(filter)) q.priority = filter;
    const items = await SalesTask.find(q).sort({ createdAt: -1 });
    const stats = {
      total: await SalesTask.countDocuments({ owner }),
      pending: await SalesTask.countDocuments({ owner, completed: false }),
      completed: await SalesTask.countDocuments({ owner, completed: true }),
      high: await SalesTask.countDocuments({ owner, completed: false, priority: 'high' })
    };
    res.json({ success: true, data: { items, stats }, message: 'Tasks fetched' });
  } catch (error) {
    console.error('listSalesTasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

const createSalesTask = async (req, res) => {
  try {
    const owner = safeObjectId(req.sales.id);
    const task = await SalesTask.create({ owner, ...req.body });
    res.status(201).json({ success: true, data: task, message: 'Task created' });
  } catch (error) {
    console.error('createSalesTask error:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

const updateSalesTask = async (req, res) => {
  try {
    const owner = safeObjectId(req.sales.id);
    const task = await SalesTask.findOneAndUpdate({ _id: req.params.id, owner }, req.body, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task, message: 'Task updated' });
  } catch (error) {
    console.error('updateSalesTask error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

const toggleSalesTask = async (req, res) => {
  try {
    const owner = safeObjectId(req.sales.id);
    const task = await SalesTask.findOne({ _id: req.params.id, owner });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.completed = !task.completed;
    await task.save();
    res.json({ success: true, data: task, message: 'Task toggled' });
  } catch (error) {
    console.error('toggleSalesTask error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle task' });
  }
};

const deleteSalesTask = async (req, res) => {
  try {
    const owner = safeObjectId(req.sales.id);
    const task = await SalesTask.findOneAndDelete({ _id: req.params.id, owner });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task, message: 'Task deleted' });
  } catch (error) {
    console.error('deleteSalesTask error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

// Meetings
const listSalesMeetings = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const { search = '', filter = 'all' } = req.query;
    const q = { $or: [ { assignee: salesId }, { createdBy: salesId } ] };
    if (search) {
      q.$or = [ { location: new RegExp(search,'i') } ];
    }
    const items = await SalesMeeting.find(q)
      .populate('client', 'name phoneNumber')
      .populate('assignee', 'name')
      .sort({ meetingDate: 1, meetingTime: 1 });
    const todayStr = new Date().toISOString().split('T')[0];
    const classify = (m) => {
      const d = new Date(m.meetingDate).toISOString().split('T')[0];
      if (d === todayStr) return 'today';
      return (new Date(m.meetingDate) >= new Date()) ? 'upcoming' : 'completed';
    };
    const filtered = items.filter(m => filter === 'all' || classify(m) === filter);
    const stats = {
      total: items.length,
      today: items.filter(m => classify(m) === 'today').length,
      upcoming: items.filter(m => classify(m) === 'upcoming').length
    };
    res.json({ success: true, data: { items: filtered, stats }, message: 'Meetings fetched' });
  } catch (error) {
    console.error('listSalesMeetings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
};

const createSalesMeeting = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const payload = { ...req.body, createdBy: salesId };
    const meeting = await SalesMeeting.create(payload);
    res.status(201).json({ success: true, data: meeting, message: 'Meeting created' });
  } catch (error) {
    console.error('createSalesMeeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to create meeting' });
  }
};

const updateSalesMeeting = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const updateData = { ...req.body };
    
    // If status is being set to completed, add completedAt timestamp
    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }
    
    const meeting = await SalesMeeting.findOneAndUpdate(
      { _id: req.params.id, createdBy: salesId }, 
      updateData, 
      { new: true }
    ).populate('client', 'name phoneNumber').populate('assignee', 'name');
    
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, data: meeting, message: 'Meeting updated' });
  } catch (error) {
    console.error('updateSalesMeeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to update meeting' });
  }
};

const deleteSalesMeeting = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const meeting = await SalesMeeting.findOneAndDelete({ _id: req.params.id, createdBy: salesId });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, data: meeting, message: 'Meeting deleted' });
  } catch (error) {
    console.error('deleteSalesMeeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete meeting' });
  }
};

// Clients converted by me (for meetings dropdown)
const getMyConvertedClients = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const Project = require('../models/Project');
    
    // First, get clients directly converted by this sales employee
    let clientIds = new Set();
    const directClients = await Client.find({ convertedBy: salesId }).select('_id');
    directClients.forEach(c => clientIds.add(c._id.toString()));
    
    // Also find clients through projects submitted by this sales employee
    // (for backward compatibility - projects have submittedBy field)
    const projects = await Project.find({ submittedBy: salesId }).select('client');
    projects.forEach(p => {
      if (p.client) {
        clientIds.add(p.client.toString());
      }
    });
    
    // Also find clients through converted leads assigned to this sales employee
    // (additional way to find clients if convertedBy wasn't set)
    const convertedLeads = await Lead.find({ 
      assignedTo: salesId, 
      status: 'converted' 
    }).select('phone');
    
    if (convertedLeads.length > 0) {
      const phoneNumbers = convertedLeads.map(l => l.phone).filter(Boolean);
      const clientsFromLeads = await Client.find({ phoneNumber: { $in: phoneNumbers } }).select('_id');
      clientsFromLeads.forEach(c => clientIds.add(c._id.toString()));
    }
    
    // Fetch all unique clients
    const clientIdArray = Array.from(clientIds).map(id => safeObjectId(id));
    const clients = await Client.find({ _id: { $in: clientIdArray } })
      .select('name phoneNumber companyName email')
      .sort({ name: 1 });
    
    res.json({ success: true, data: clients, message: 'Clients fetched' });
  } catch (error) {
    console.error('getMyConvertedClients error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clients' });
  }
};

// @desc    Login Sales
// @route   POST /api/sales/login
// @access  Public
const loginSales = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if Sales exists and include password for comparison
    const sales = await Sales.findOne({ email }).select('+password');
    
    if (!sales) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (sales.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if Sales is active
    if (!sales.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact system administrator.'
      });
    }

    // Check password
    const isPasswordValid = await sales.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await sales.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts and update last login
    await sales.resetLoginAttempts();

    // Generate JWT token
    const token = generateToken(sales._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Send response with token
    res.status(200)
      .cookie('salesToken', token, cookieOptions)
      .json({
        success: true,
        message: 'Login successful',
        data: {
          sales: {
            id: sales._id,
            name: sales.name,
            email: sales.email,
            role: sales.role,
            department: sales.department,
            employeeId: sales.employeeId,
            phone: sales.phone,
            lastLogin: sales.lastLogin,
            salesTarget: sales.salesTarget,
            currentSales: sales.currentSales,
            commissionRate: sales.commissionRate,
            experience: sales.experience,
            skills: sales.skills
          },
          token
        }
      });

  } catch (error) {
    console.error('Sales Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current Sales profile
// @route   GET /api/sales/profile
// @access  Private
const getSalesProfile = async (req, res) => {
  try {
    const sales = await Sales.findById(req.sales.id);
    
    if (!sales) {
      return res.status(404).json({
        success: false,
        message: 'Sales not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sales: {
          id: sales._id,
          name: sales.name,
          email: sales.email,
          role: sales.role,
          department: sales.department,
          employeeId: sales.employeeId,
          phone: sales.phone,
          isActive: sales.isActive,
          lastLogin: sales.lastLogin,
          salesTarget: sales.salesTarget,
          currentSales: sales.currentSales,
          commissionRate: sales.commissionRate,
          experience: sales.experience,
          skills: sales.skills,
          leadsManaged: sales.leadsManaged,
          clientsManaged: sales.clientsManaged,
          createdAt: sales.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get Sales profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Logout Sales
// @route   POST /api/sales/logout
// @access  Private
const logoutSales = async (req, res) => {
  try {
    res.cookie('salesToken', '', {
      expires: new Date(0),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Sales Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Create demo Sales (for development only)
// @route   POST /api/sales/create-demo
// @access  Public (remove in production)
const createDemoSales = async (req, res) => {
  try {
    // Check if demo Sales already exists
    const existingSales = await Sales.findOne({ email: 'sales@demo.com' });
    
    if (existingSales) {
      return res.status(400).json({
        success: false,
        message: 'Demo Sales already exists'
      });
    }

    // Create demo Sales
    const demoSales = await Sales.create({
      name: 'Demo Sales Representative',
      email: 'sales@demo.com',
      password: 'password123',
      role: 'sales',
      department: 'Sales',
      employeeId: 'SL001',
      phone: '+1234567890',
      salesTarget: 100000,
      currentSales: 25000,
      commissionRate: 5,
      skills: ['Sales', 'Lead Generation', 'Customer Relations'],
      experience: 2
    });

    res.status(201).json({
      success: true,
      message: 'Demo Sales created successfully',
      data: {
        sales: {
          id: demoSales._id,
          name: demoSales.name,
          email: demoSales.email,
          role: demoSales.role,
          department: demoSales.department,
          employeeId: demoSales.employeeId
        }
      }
    });

  } catch (error) {
    console.error('Create demo Sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating demo Sales'
    });
  }
};

// @desc    Create lead by sales employee
// @route   POST /api/sales/leads
// @access  Private (Sales only)
const createLeadBySales = async (req, res) => {
  try {
    const { phone, name, company, email, category, priority, value, notes } = req.body;

    // Validate required fields
    if (!phone || !category) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and category are required'
      });
    }

    // Check if lead with phone number already exists
    const existingLead = await Lead.findOne({ phone });
    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: 'Lead with this phone number already exists'
      });
    }

    // Verify category exists
    const categoryExists = await LeadCategory.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Create lead with sales employee as creator AND assignee
    const lead = await Lead.create({
      phone,
      name,
      company,
      email,
      category,
      priority: priority || 'medium',
      value: value || 0,
      notes,
      createdBy: req.sales.id,
      creatorModel: 'Sales',
      assignedTo: req.sales.id, // Auto-assign to self
      status: 'new',
      source: 'manual'
    });

    // Update sales employee's leadsManaged array
    await Sales.findByIdAndUpdate(req.sales.id, {
      $push: { leadsManaged: lead._id }
    });

    // Update sales employee's lead statistics
    const sales = await Sales.findById(req.sales.id);
    await sales.updateLeadStats();

    // Populate for response
    await lead.populate('category', 'name color icon');
    await lead.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });

  } catch (error) {
    console.error('Create lead by sales error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Lead with this phone number already exists'
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Server error while creating lead'
    });
  }
};

// @desc    Get all lead categories for sales
// @route   GET /api/sales/lead-categories
// @access  Private (Sales only)
const getLeadCategories = async (req, res) => {
  try {
    const categories = await LeadCategory.find()
      .select('name description color icon')
      .sort('name');

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get lead categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
};

// @desc    Debug endpoint to check leads in database
// @route   GET /api/sales/debug/leads
// @access  Private (Sales only)
const debugLeads = async (req, res) => {
  try {
    const salesId = req.sales.id;
    
    // Get all leads for this sales employee
    const leads = await Lead.find({ assignedTo: salesId }).select('phone status assignedTo createdAt');
    
    // Get all leads in the database (for debugging)
    const allLeads = await Lead.find({}).select('phone status assignedTo createdAt').limit(10);
    
    res.status(200).json({
      success: true,
      data: {
        salesId,
        leadsForSales: leads,
        allLeadsInDB: allLeads,
        totalLeadsForSales: leads.length,
        totalLeadsInDB: await Lead.countDocuments({})
      }
    });
  } catch (error) {
    console.error('Debug leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while debugging leads'
    });
  }
};

// @desc    Get tile card statistics for dashboard
// @route   GET /api/sales/dashboard/tile-stats
// @access  Private (Sales only)
const getTileCardStats = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    // 1. Payment Recovery Stats
    const myClients = await Client.find({ convertedBy: salesId }).select('_id');
    const clientIds = myClients.map(c => c._id);
    const projects = await Project.find({ client: { $in: clientIds } }).select('dueDate financialDetails updatedAt createdAt');
    
    // Count pending payments (projects with remainingAmount > 0)
    let pendingPayments = 0;
    let paymentsThisWeek = 0;
    const allPendingProjects = [];
    
    projects.forEach(p => {
      const rem = p.financialDetails?.remainingAmount || 0;
      if (rem > 0) {
        pendingPayments += 1;
        allPendingProjects.push(p);
      }
    });
    
    // Count payments added this week (new projects with pending payments created this week)
    paymentsThisWeek = allPendingProjects.filter(p => {
      const createdDate = p.createdAt || p.updatedAt;
      return createdDate && createdDate >= weekStart;
    }).length;

    // 2. Demo Requests Stats
    const demoRequests = await Lead.find({ 
      assignedTo: salesId,
      $or: [
        { 'demoRequest.status': { $exists: true } },
        { status: 'demo_requested' }
      ]
    });
    
    let newDemoRequests = 0;
    let demosToday = 0;
    demoRequests.forEach(lead => {
      const demoStatus = lead.demoRequest?.status || (lead.status === 'demo_requested' ? 'pending' : null);
      if (demoStatus === 'pending' || demoStatus === 'new') {
        newDemoRequests += 1;
      }
      // Check if created today
      if (lead.createdAt && lead.createdAt >= todayStart && lead.createdAt <= todayEnd) {
        demosToday += 1;
      }
    });

    // 3. Tasks Stats
    const allTasks = await SalesTask.find({ owner: salesId });
    const pendingTasks = allTasks.filter(t => !t.completed).length;
    
    // Count completed tasks today
    const tasksCompletedToday = allTasks.filter(t => 
      t.completed && 
      t.updatedAt && 
      t.updatedAt >= todayStart && 
      t.updatedAt <= todayEnd
    ).length;
    
    // Count completed tasks yesterday
    const tasksCompletedYesterday = allTasks.filter(t => 
      t.completed && 
      t.updatedAt && 
      t.updatedAt >= yesterdayStart && 
      t.updatedAt <= yesterdayEnd
    ).length;
    
    const tasksChange = tasksCompletedToday - tasksCompletedYesterday;

    // 4. Meetings Stats
    const allMeetings = await SalesMeeting.find({
      $or: [
        { assignee: salesId },
        { createdBy: salesId }
      ]
    });
    
    const todayMeetings = allMeetings.filter(m => {
      const meetingDate = new Date(m.meetingDate);
      return meetingDate >= todayStart && meetingDate <= todayEnd && m.status !== 'cancelled';
    }).length;
    
    const upcomingMeetings = allMeetings.filter(m => {
      const meetingDate = new Date(m.meetingDate);
      return meetingDate > todayEnd && m.status === 'scheduled';
    }).length;

    res.json({
      success: true,
      data: {
        paymentRecovery: {
          pending: pendingPayments,
          changeThisWeek: paymentsThisWeek
        },
        demoRequests: {
          new: newDemoRequests,
          today: demosToday
        },
        tasks: {
          pending: pendingTasks,
          change: tasksChange
        },
        meetings: {
          today: todayMeetings,
          upcoming: upcomingMeetings
        }
      }
    });
  } catch (error) {
    console.error('getTileCardStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tile card stats' });
  }
};

// @desc    Get dashboard hero card statistics (monthly sales, target, reward, incentives, etc.)
// @route   GET /api/sales/dashboard/hero-stats
// @access  Private (Sales only)
const getDashboardHeroStats = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const Sales = require('../models/Sales');
    const Client = require('../models/Client');
    const Project = require('../models/Project');
    const Lead = require('../models/Lead');
    
    // Get sales employee data
    const sales = await Sales.findById(salesId).select('name salesTarget reward incentivePerClient');
    if (!sales) {
      return res.status(404).json({ success: false, message: 'Sales employee not found' });
    }
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Get clients converted by this sales employee
    const convertedClients = await Client.find({ convertedBy: salesId })
      .select('_id conversionDate');
    
    // Filter clients converted this month and today
    const monthlyClientIds = convertedClients
      .filter(c => c.conversionDate && c.conversionDate >= monthStart && c.conversionDate <= monthEnd)
      .map(c => c._id.toString());
    
    const todayClientIds = convertedClients
      .filter(c => c.conversionDate && c.conversionDate >= todayStart && c.conversionDate <= todayEnd)
      .map(c => c._id.toString());
    
    // Get all projects for clients converted this month and today
    const allClientIds = convertedClients.map(c => c._id);
    const projects = await Project.find({ client: { $in: allClientIds } })
      .select('client financialDetails.totalCost budget createdAt');
    
    // Calculate monthly sales (sum of project costs for clients converted this month)
    let monthlySales = 0;
    projects.forEach(p => {
      const clientIdStr = p.client.toString();
      if (monthlyClientIds.includes(clientIdStr)) {
        const cost = p.financialDetails?.totalCost || p.budget || 0;
        monthlySales += cost;
      }
    });
    
    // Calculate today's sales (sum of project costs for clients converted today)
    let todaysSales = 0;
    projects.forEach(p => {
      const clientIdStr = p.client.toString();
      if (todayClientIds.includes(clientIdStr)) {
        const cost = p.financialDetails?.totalCost || p.budget || 0;
        todaysSales += cost;
      }
    });
    
    // Count clients converted this month
    const monthlyConvertedCount = monthlyClientIds.length;
    
    // Count clients converted today
    const todayConvertedCount = todayClientIds.length;
    
    // Calculate incentives from actual conversion-based incentives
    const Incentive = require('../models/Incentive');
    
    // Get all conversion-based incentives for this sales employee
    const conversionIncentives = await Incentive.find({
      salesEmployee: salesId,
      isConversionBased: true
    }).select('amount dateAwarded');
    
    // Calculate monthly incentive (sum of amounts from incentives created this month)
    const monthlyIncentives = conversionIncentives.filter(inc => {
      const dateAwarded = new Date(inc.dateAwarded);
      return dateAwarded >= monthStart && dateAwarded <= monthEnd;
    });
    const monthlyIncentive = monthlyIncentives.reduce((sum, inc) => sum + (inc.amount || 0), 0);
    
    // Calculate today's incentive (sum of amounts from incentives created today)
    const todaysIncentives = conversionIncentives.filter(inc => {
      const dateAwarded = new Date(inc.dateAwarded);
      return dateAwarded >= todayStart && dateAwarded <= todayEnd;
    });
    const todaysIncentive = todaysIncentives.reduce((sum, inc) => sum + (inc.amount || 0), 0);
    
    // Calculate progress to target
    const target = sales.salesTarget || 0;
    const progressToTarget = target > 0 ? Math.round((monthlySales / target) * 100) : 0;
    
    // Get total leads count
    const totalLeads = await Lead.countDocuments({ assignedTo: salesId });
    
    // Get total clients count
    const totalClients = convertedClients.length;
    
    // Get reward
    const reward = sales.reward || 0;
    
    // Extract first name from full name
    const getFirstName = (fullName) => {
      if (!fullName) return 'Employee';
      const nameParts = fullName.trim().split(/\s+/);
      return nameParts[0] || 'Employee';
    };
    
    res.json({
      success: true,
      data: {
        employeeName: getFirstName(sales.name),
        monthlySales: Math.round(monthlySales),
        target: target,
        progressToTarget: Math.min(progressToTarget, 100), // Cap at 100%
        reward: reward,
        todaysSales: Math.round(todaysSales),
        todaysIncentive: Math.round(todaysIncentive),
        monthlyIncentive: Math.round(monthlyIncentive),
        totalLeads: totalLeads,
        totalClients: totalClients
      }
    });
  } catch (error) {
    console.error('getDashboardHeroStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard hero stats' });
  }
};

// @desc    Get sales dashboard statistics
// @route   GET /api/sales/dashboard/statistics
// @access  Private (Sales only)
const getSalesDashboardStats = async (req, res) => {
  try {
    const salesId = req.sales.id;

    // Get total leads count for this sales employee
    const totalLeadsCount = await Lead.countDocuments({ assignedTo: new mongoose.Types.ObjectId(salesId) });

    // Aggregate leads by status for the logged-in sales employee
    const stats = await Lead.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(salesId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize all possible status counts
    const statusCounts = {
      new: 0,
      connected: 0,
      not_picked: 0,
      followup: 0, // Changed from today_followup to followup to match Lead model
      quotation_sent: 0,
      dq_sent: 0,
      app_client: 0,
      web: 0,
      converted: 0,
      lost: 0,
      hot: 0,
      demo_requested: 0,
      not_interested: 0
    };

    // Map aggregation results to status counts
    stats.forEach(stat => {
      if (statusCounts.hasOwnProperty(stat._id)) {
        statusCounts[stat._id] = stat.count;
      }
    });

    // Calculate total leads
    const totalLeads = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        totalLeads,
        salesEmployee: {
          id: req.sales.id,
          name: req.sales.name
        }
      }
    });

  } catch (error) {
    console.error('Get sales dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

// @desc    Monthly conversions for bar chart (last N months)
// @route   GET /api/sales/analytics/conversions/monthly
// @access  Private (Sales only)
const getMonthlyConversions = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const months = Math.min(parseInt(req.query.months || '12', 10) || 12, 24);
    const salesObjectId = new mongoose.Types.ObjectId(salesId);

    // Use convertedAt if present else updatedAt
    const dateField = '$convertedAt';

    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0,0,0,0);

    const agg = await Lead.aggregate([
      { $match: { assignedTo: salesObjectId, status: 'converted', $or: [ { convertedAt: { $exists: true } }, { updatedAt: { $exists: true } } ] } },
      { $addFields: { metricDate: { $ifNull: ['$convertedAt', '$updatedAt'] } } },
      { $match: { metricDate: { $gte: since } } },
      { $group: {
          _id: {
            y: { $year: '$metricDate' },
            m: { $month: '$metricDate' }
          },
          converted: { $sum: 1 }
        }
      }
    ]);

    // Build 12-month series with zeros filled
    const frames = getLastNMonths(months);
    const map = new Map();
    agg.forEach(r => {
      map.set(`${r._id.y}-${r._id.m}`, r.converted);
    });

    const items = frames.map(f => ({
      month: f.label,
      year: f.year,
      converted: map.get(`${f.year}-${f.monthIndex}`) || 0
    }));

    const totalConverted = items.reduce((s, x) => s + x.converted, 0);
    const best = items.reduce((b, x) => (x.converted > (b?.converted || 0) ? { label: x.month, converted: x.converted } : b), { label: items[0]?.month || '', converted: items[0]?.converted || 0 });
    const avgRate = items.length ? Number((totalConverted / items.length).toFixed(1)) : 0;

    res.status(200).json({ success: true, data: { items, best, avgRate, totalConverted } });
  } catch (error) {
    console.error('Get monthly conversions error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching monthly conversions' });
  }
};

// @desc    Get all leads assigned to sales employee
// @route   GET /api/sales/leads
// @access  Private (Sales only)
const getMyLeads = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const { 
      status, 
      category, 
      priority, 
      search, 
      page = 1, 
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    // Ensure proper ObjectId for assignedTo in "get my leads" too
    let myAssignedTo = salesId;
    try { myAssignedTo = new mongoose.Types.ObjectId(salesId); } catch (_) { myAssignedTo = salesId; }
    let filter = { assignedTo: myAssignedTo };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (category && category !== 'all') {
      filter.category = category;
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
      .populate('leadProfile', 'name businessName projectType estimatedCost quotationSent demoSent')
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

  } catch (error) {
    console.error('Get my leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leads'
    });
  }
};

// @desc    Get leads by specific status
// @route   GET /api/sales/leads/status/:status
// @access  Private (Sales only)
const getLeadsByStatus = async (req, res) => {
  try {
    // Check if sales user is authenticated
    if (!req.sales || !req.sales.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const salesId = req.sales.id;
    const { status } = req.params;
    const { 
      category, 
      priority, 
      search, 
      timeFrame,
      page = 1, 
      limit = 12 
    } = req.query;

    // Validate status (with backward compatibility for today_followup)
    const validStatuses = ['new', 'connected', 'not_picked', 'followup', 'today_followup', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'converted', 'lost', 'hot', 'demo_requested', 'not_interested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Handle backward compatibility: treat today_followup as followup
    let actualStatus = status;
    if (status === 'today_followup') {
      actualStatus = 'followup';
    }

    // Build filter object
    // Ensure proper ObjectId matching for assignedTo (with safe fallback)
    let assignedToValue = salesId;
    try {
      assignedToValue = new mongoose.Types.ObjectId(salesId);
    } catch (e) {
      // Fallback to string matching if casting fails (should not happen in normal flow)
      assignedToValue = salesId;
    }
    let filter = { 
      assignedTo: assignedToValue,
      status: actualStatus 
    };

    if (category && category !== 'all') {
      filter.category = category;
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

    // Add time frame filtering for followup status
    if (actualStatus === 'followup') {
      const now = new Date();
      let startDate, endDate;
      
      if (timeFrame && timeFrame !== 'all') {
        switch(timeFrame) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
          case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 23, 59, 59, 999);
            break;
        }
      } else if (timeFrame === 'all') {
        // For 'all' filter, show all upcoming follow-ups (from today onwards)
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = null; // No end date limit
      } else {
        // Default: show today's follow-ups
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
      
      const followUpFilter = {
        scheduledDate: { $gte: startDate },
        status: 'pending'
      };
      
      if (endDate) {
        followUpFilter.scheduledDate.$lte = endDate;
      }
      
      filter.followUps = {
        $elemMatch: followUpFilter
      };
    } else if (timeFrame && timeFrame !== 'all') {
      // For other statuses, filter by creation date
      const now = new Date();
      let startDate, endDate;
      
      switch(timeFrame) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
      }
      
      if (startDate) {
        filter.createdAt = { $gte: startDate };
        if (endDate) {
          filter.createdAt.$lte = endDate;
        }
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let leads = await Lead.find(filter)
      .populate('category', 'name color icon')
      .populate('leadProfile', 'name businessName projectType estimatedCost quotationSent demoSent')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // For converted leads, populate associated project with financial details
    if (status === 'converted') {
      const leadIds = leads.map(lead => lead._id);
      const projects = await Project.find({ originLead: { $in: leadIds } })
        .select('originLead client financialDetails budget projectType status progress')
        .lean();
      const phoneNumbers = leads
        .map((lead) => lead.phone)
        .filter((phone) => typeof phone === 'string' && phone.length > 0);
      const clientQueryOr = [];
      if (leadIds.length > 0) {
        clientQueryOr.push({ originLead: { $in: leadIds } });
      }
      if (phoneNumbers.length > 0) {
        clientQueryOr.push({ phoneNumber: { $in: phoneNumbers } });
      }
      let clients = [];
      if (clientQueryOr.length > 0) {
        clients = await Client.find({ $or: clientQueryOr })
          .select('_id originLead phoneNumber name companyName')
          .lean();
      }
      
      // Create a map of leadId -> project
      const projectMap = {};
      projects.forEach(project => {
        if (project.originLead) {
          projectMap[project.originLead.toString()] = project;
        }
      });

      const clientMapByLead = new Map();
      const clientMapByPhone = new Map();
      clients.forEach((client) => {
        if (client.originLead) {
          clientMapByLead.set(client.originLead.toString(), client);
        }
        if (client.phoneNumber) {
          clientMapByPhone.set(client.phoneNumber, client);
        }
      });
      
      // Attach project data to each lead
      leads = leads.map(lead => {
        const leadObj = lead.toObject();
        const project = projectMap[lead._id.toString()];
        if (project) {
          leadObj.project = project;
        }
        const clientDoc =
          clientMapByLead.get(lead._id.toString()) ||
          (lead.phone ? clientMapByPhone.get(lead.phone) : null);

        if (clientDoc) {
          const clientIdStr =
            typeof clientDoc._id === 'object' && clientDoc._id !== null && clientDoc._id.toString
              ? clientDoc._id.toString()
              : clientDoc._id;
          leadObj.convertedClient = {
            id: clientIdStr,
            name: clientDoc.name,
            phoneNumber: clientDoc.phoneNumber,
            companyName: clientDoc.companyName
          };
          leadObj.convertedClientId = clientIdStr;
        } else {
          leadObj.convertedClient = null;
          leadObj.convertedClientId = null;
        }
        return leadObj;
      });
    }

    const totalLeads = await Lead.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: leads.length,
      total: totalLeads,
      page: pageNum,
      pages: Math.ceil(totalLeads / limitNum),
      status: status,
      data: leads
    });

  } catch (error) {
    const errMsg = error && error.message ? error.message : String(error);
    console.error('Get leads by status error:', errMsg);
    if (error && error.stack) console.error(error.stack);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      message: isDev ? `Server error while fetching leads by status: ${errMsg}` : 'Server error while fetching leads by status',
      error: isDev ? errMsg : undefined
    });
  }
};

// @desc    Get single lead detail
// @route   GET /api/sales/leads/:id
// @access  Private (Sales only)
const getLeadDetail = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const leadId = req.params.id;

    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: salesId 
    })
      .populate('category', 'name color icon description')
      .populate('assignedTo', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('leadProfile', 'name businessName email projectType estimatedCost description quotationSent demoSent notes documents');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });

  } catch (error) {
    console.error('Get lead detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lead detail'
    });
  }
};

// @desc    Update lead status
// @route   PATCH /api/sales/leads/:id/status
// @access  Private (Sales only)
const updateLeadStatus = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const leadId = req.params.id;
    const { status, notes, followupDate, followupTime, priority } = req.body;

    // Validate status (with backward compatibility for today_followup)
    const validStatuses = ['new', 'connected', 'not_picked', 'followup', 'today_followup', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'converted', 'lost', 'hot', 'demo_requested', 'not_interested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Handle backward compatibility: treat today_followup as followup
    let actualStatus = status;
    if (status === 'today_followup') {
      actualStatus = 'followup';
    }

    // Find lead and verify ownership
    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: salesId 
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    // Validate status transition
    const validTransitions = {
      'new': ['connected', 'not_picked', 'not_interested', 'lost'],
      'connected': ['hot', 'followup', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'demo_requested', 'not_interested', 'lost'],
      'not_picked': ['connected', 'followup', 'not_interested', 'lost'],
      'followup': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'demo_requested', 'not_interested', 'lost'],
      'quotation_sent': ['connected', 'hot', 'dq_sent', 'app_client', 'web', 'demo_requested', 'converted', 'not_interested', 'lost'],
      'dq_sent': ['connected', 'hot', 'quotation_sent', 'app_client', 'web', 'demo_requested', 'converted', 'not_interested', 'lost'],
      'app_client': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'web', 'demo_requested', 'converted', 'not_interested', 'lost'],
      'web': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'app_client', 'demo_requested', 'converted', 'not_interested', 'lost'],
      'demo_requested': ['connected', 'hot', 'quotation_sent', 'dq_sent', 'app_client', 'web', 'converted', 'not_interested', 'lost'],
      'hot': ['quotation_sent', 'dq_sent', 'app_client', 'web', 'demo_requested', 'converted', 'not_interested', 'lost'],
      'converted': [],
      'lost': ['connected'],
      'not_interested': ['connected']
    };

    if (!validTransitions[lead.status].includes(actualStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${lead.status} to ${actualStatus}`
      });
    }

    // Update lead status
    const oldStatus = lead.status;
    lead.status = actualStatus;
    lead.lastContactDate = new Date();

    // If converting, stamp convertedAt if missing
    if (actualStatus === 'converted' && !lead.convertedAt) {
      lead.convertedAt = new Date();
    }

    // Handle follow-up scheduling
    if (actualStatus === 'followup' && followupDate && followupTime) {
      // Validate follow-up data
      if (!followupDate || !followupTime) {
        return res.status(400).json({
          success: false,
          message: 'Follow-up date and time are required for followup status'
        });
      }

      // Add follow-up entry
      // Ensure the date is parsed correctly (handle both ISO strings and date objects)
      let parsedDate;
      if (typeof followupDate === 'string') {
        // If it's a string, parse it as ISO date
        parsedDate = new Date(followupDate);
      } else {
        parsedDate = new Date(followupDate);
      }
      
      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up date format'
        });
      }
      
      
      const followUpData = {
        scheduledDate: parsedDate,
        scheduledTime: followupTime,
        notes: notes || '',
        priority: priority || 'medium',
        type: 'call',
        status: 'pending'
      };

      lead.followUps.push(followUpData);
      
      // Update lead priority if provided
      if (priority) {
        lead.priority = priority;
      }

      // Update nextFollowUpDate to the nearest upcoming follow-up (including today)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      const upcomingFollowUps = lead.followUps
        .filter(fu => fu.status === 'pending' && fu.scheduledDate >= today)
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
      
      if (upcomingFollowUps.length > 0) {
        lead.nextFollowUpDate = upcomingFollowUps[0].scheduledDate;
      }

      // Add activity log for follow-up scheduling
      lead.activities.push({
        type: 'status_change',
        description: `Status changed from ${oldStatus} to ${actualStatus}. Follow-up scheduled for ${followupDate} at ${followupTime}${notes ? ` - ${notes}` : ''}`,
        performedBy: salesId,
        timestamp: new Date()
      });
    } else {
      // Add activity log for regular status change
      lead.activities.push({
        type: 'status_change',
        description: `Status changed from ${oldStatus} to ${actualStatus}${notes ? ` - ${notes}` : ''}`,
        performedBy: salesId,
        timestamp: new Date()
      });
    }

    // Ensure creatorModel is preserved (required field)
    if (!lead.creatorModel) {
      // If creatorModel is missing, set it based on context (Sales route)
      lead.creatorModel = 'Sales';
    }

    await lead.save();

    // Update sales employee's lead statistics
    const sales = await Sales.findById(salesId);
    await sales.updateLeadStats();

    // Populate for response
    await lead.populate('category', 'name color icon');
    await lead.populate('leadProfile', 'name businessName projectType estimatedCost quotationSent demoSent');

    res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      data: lead
    });

  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lead status'
    });
  }
};

// @desc    Create lead profile
// @route   POST /api/sales/leads/:id/profile
// @access  Private (Sales only)
const createLeadProfile = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const leadId = req.params.id;
    const { name, businessName, email, projectType, estimatedCost, description, quotationSent, demoSent } = req.body;

    // Find lead and verify ownership
    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: salesId 
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    // Check if profile already exists
    if (lead.leadProfile) {
      return res.status(400).json({
        success: false,
        message: 'Lead profile already exists'
      });
    }

    // Create lead profile
    const LeadProfile = require('../models/LeadProfile');
    const leadProfile = await LeadProfile.create({
      lead: leadId,
      name,
      businessName,
      email,
      projectType: projectType || { web: false, app: false, taxi: false },
      estimatedCost: estimatedCost || 0,
      description,
      quotationSent: quotationSent || false,
      demoSent: demoSent || false,
      createdBy: salesId
    });

    // Update lead with profile reference
    lead.leadProfile = leadProfile._id;
    await lead.save();

    res.status(201).json({
      success: true,
      message: 'Lead profile created successfully',
      data: leadProfile
    });

  } catch (error) {
    console.error('Create lead profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating lead profile'
    });
  }
};

// @desc    Update lead profile
// @route   PUT /api/sales/leads/:id/profile
// @access  Private (Sales only)
const updateLeadProfile = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const leadId = req.params.id;
    const updateData = req.body;

    // Find lead and verify ownership
    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: salesId 
    }).populate('leadProfile');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    if (!lead.leadProfile) {
      return res.status(404).json({
        success: false,
        message: 'Lead profile not found'
      });
    }

    // Update lead profile
    const LeadProfile = require('../models/LeadProfile');
    const leadProfile = await LeadProfile.findByIdAndUpdate(
      lead.leadProfile._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Lead profile updated successfully',
      data: leadProfile
    });

  } catch (error) {
    console.error('Update lead profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lead profile'
    });
  }
};

// @desc    Convert lead to client and create project (pending-assignment)
// @route   POST /api/sales/leads/:id/convert
// @access  Private (Sales only)
const convertLeadToClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle both FormData and JSON requests
    let projectData;
    if (req.body.projectData) {
      // JSON request
      projectData = req.body.projectData;
    } else {
      // FormData request - parse fields
      projectData = {
        projectName: req.body.projectName,
        projectType: req.body.projectType ? (typeof req.body.projectType === 'string' ? JSON.parse(req.body.projectType) : req.body.projectType) : { web: false, app: false, taxi: false },
        totalCost: req.body.totalCost ? parseFloat(req.body.totalCost) : 0,
        finishedDays: req.body.finishedDays ? parseInt(req.body.finishedDays) : undefined,
        advanceReceived: req.body.advanceReceived ? parseFloat(req.body.advanceReceived) : 0,
        includeGST: req.body.includeGST === 'true' || req.body.includeGST === true,
        description: req.body.description || ''
      };
    }

    const { uploadToCloudinary } = require('../services/cloudinaryService');
    const lead = await Lead.findById(id).populate('leadProfile');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Verify lead belongs to current sales employee
    if (!lead.assignedTo || lead.assignedTo.toString() !== req.sales.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to convert this lead' });
    }

    // Verify lead has profile
    if (!lead.leadProfile) {
      return res.status(400).json({ success: false, message: 'Lead must have a profile before conversion' });
    }

    // Idempotency: if a project already exists for this lead, return it
    const Project = require('../models/Project');
    const existingProject = await Project.findOne({ originLead: id }).populate('client');
    if (lead.status === 'converted' && existingProject) {
      return res.status(409).json({
        success: true,
        message: 'Lead already converted',
        data: { client: existingProject.client, project: existingProject, lead }
      });
    }

    // Upsert Client by phone number
    const Client = require('../models/Client');
    const phoneNumber = lead.phone;
    let client = await Client.findOne({ phoneNumber });
    if (!client) {
      client = await Client.create({
        phoneNumber,
        name: lead.leadProfile.name || lead.name || 'Client',
        companyName: lead.leadProfile.businessName || lead.company || '',
        email: lead.email || undefined,
        isActive: true,
        convertedBy: req.sales.id,
        conversionDate: new Date(),
        originLead: lead._id
        // OTP is generated during client login via existing OTP flow
      });
    } else {
      // Update existing client with conversion info if not already set
      if (!client.convertedBy) {
        client.convertedBy = req.sales.id;
        client.conversionDate = new Date();
        client.originLead = lead._id;
        await client.save();
      }
    }

    // Prepare project fields
    const totalCost = projectData?.totalCost ? Number(projectData.totalCost) : (lead.leadProfile.estimatedCost || 0);
    const advanceReceived = projectData?.advanceReceived ? Number(projectData.advanceReceived) : 0;
    const includeGST = projectData?.includeGST || false;
    const remainingAmount = totalCost - advanceReceived;

    const name = projectData?.projectName || 'Sales Converted Project';
    const description = projectData?.description || lead.leadProfile.description || 'Created from sales conversion';
    const projectType = projectData?.projectType || lead.leadProfile.projectType || { web: false, app: false, taxi: false };
    const finishedDays = projectData?.finishedDays ? parseInt(projectData.finishedDays) : undefined;

    // Handle screenshot upload if present
    let screenshotAttachment = null;
    if (req.file) {
      try {
        // Check if Cloudinary is configured
        const cloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET;
        
        if (!cloudinaryConfig) {
          console.warn('Cloudinary not configured, skipping screenshot upload');
        } else {
          const uploadResult = await uploadToCloudinary(req.file, 'projects/conversions');
          
          // Check if upload was successful
          if (uploadResult.success && uploadResult.data) {
            const result = uploadResult.data;
            screenshotAttachment = {
              public_id: result.public_id,
              secure_url: result.secure_url,
              originalName: result.original_filename || req.file.originalname,
              original_filename: result.original_filename || req.file.originalname,
              format: result.format,
              size: result.bytes,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              resource_type: 'image',
              uploadedAt: new Date()
            };
          } else {
            console.warn('Screenshot upload failed:', uploadResult.error || 'Unknown error');
            // Continue without screenshot if upload fails
          }
        }
      } catch (uploadError) {
        console.error('Error uploading screenshot:', uploadError.message || uploadError);
        // Continue without screenshot if upload fails - conversion should still succeed
      }
    }

    // Create Project with pending-assignment status and submittedBy
    const projectFields = {
      name,
      description,
      client: client._id,
      projectType,
      status: 'pending-assignment',
      budget: totalCost,
      startDate: new Date(),
      submittedBy: req.sales.id,
      originLead: lead._id,
      financialDetails: {
        totalCost,
        advanceReceived,
        includeGST,
        remainingAmount
      }
    };

    if (finishedDays) {
      projectFields.finishedDays = finishedDays;
    }

    if (screenshotAttachment) {
      projectFields.attachments = [screenshotAttachment];
    }

    const newProject = await Project.create(projectFields);

    // Create incoming transaction for advance payment (if advanceReceived > 0)
    if (advanceReceived > 0) {
      try {
        const { createIncomingTransaction } = require('../utils/financeTransactionHelper');
        const AdminFinance = require('../models/AdminFinance');
        const Admin = require('../models/Admin');
        
        // Check if transaction already exists (prevent duplicates)
        const existing = await AdminFinance.findOne({
          recordType: 'transaction',
          'metadata.sourceType': 'project_conversion',
          'metadata.projectId': newProject._id.toString()
        });
        
        if (!existing) {
          // Find first active admin as createdBy
          const admin = await Admin.findOne({ isActive: true }).select('_id');
          const adminId = admin ? admin._id : null;
          
          if (adminId) {
            await createIncomingTransaction({
              amount: advanceReceived,
              category: 'Advance Payment',
              transactionDate: newProject.createdAt || new Date(),
              createdBy: adminId,
              client: client._id,
              project: newProject._id,
              description: `Advance payment received for project "${newProject.name}"`,
              metadata: {
                sourceType: 'project_conversion',
                projectId: newProject._id.toString(),
                leadId: lead._id.toString()
              },
              checkDuplicate: true
            });
            console.log(`Created finance transaction for advance payment: ₹${advanceReceived} for project ${newProject._id}`);
          } else {
            console.warn('No active admin found to create finance transaction for advance payment');
          }
        } else {
          console.log(`Finance transaction already exists for project conversion: ${newProject._id}`);
        }
      } catch (error) {
        // Log error but don't fail the conversion
        console.error('Error creating finance transaction for project advance:', error);
      }
    }

    // Update lead status/value
    lead.status = 'converted';
    lead.value = totalCost;
    lead.lastContactDate = new Date();
    if (!lead.convertedAt) {
      lead.convertedAt = new Date();
    }
    await lead.save();

    // Update sales stats
    const sales = await Sales.findById(req.sales.id);
    if (sales && sales.updateLeadStats) {
      await sales.updateLeadStats();
    }

    // Create automatic incentive record for conversion (if incentivePerClient is set)
    const Incentive = require('../models/Incentive');
    const incentivePerClient = Number(sales?.incentivePerClient || 0);
    
    if (incentivePerClient > 0) {
      try {
        // Calculate split: 50% current, 50% pending
        const totalAmount = incentivePerClient;
        const currentBalance = totalAmount * 0.5;
        const pendingBalance = totalAmount * 0.5;

        // Create conversion-based incentive
        await Incentive.create({
          salesEmployee: req.sales.id,
          amount: totalAmount,
          currentBalance: currentBalance,
          pendingBalance: pendingBalance,
          reason: 'Lead conversion to client',
          description: `Automatic incentive for converting lead to client: ${client.name || 'Client'}`,
          dateAwarded: new Date(),
          status: 'conversion-current', // Has current balance portion
          isConversionBased: true,
          projectId: newProject._id,
          clientId: client._id,
          leadId: lead._id
          // createdBy is not required for conversion-based incentives
        });
      } catch (incentiveError) {
        // Log error but don't fail the conversion
        console.error('Error creating conversion incentive:', incentiveError);
        // Continue with conversion even if incentive creation fails
      }
    }

    // Respond
    const populatedProject = await Project.findById(newProject._id).populate('client');
    return res.status(201).json({
      success: true,
      message: 'Lead converted successfully',
      data: { client, project: populatedProject, lead }
    });
  } catch (error) {
    console.error('Convert lead error:', error);
    return res.status(500).json({ success: false, message: 'Server error while converting lead', error: error.message });
  }
};

// @desc    Get all sales team members
// @route   GET /api/sales/team
// @access  Private (Sales only)
const getSalesTeam = async (req, res) => {
  try {
    const salesTeam = await Sales.find({ isActive: true })
      .select('_id name email employeeId department role')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: salesTeam
    });

  } catch (error) {
    console.error('Get sales team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sales team'
    });
  }
};

// @desc    Request demo for lead
// @route   POST /api/sales/leads/:id/request-demo
// @access  Private (Sales only)
const requestDemo = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const leadId = req.params.id;
    const { clientName, description, reference, mobileNumber } = req.body;

    // Find lead and verify ownership
    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: salesId 
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    // Create demo request
    const DemoRequest = require('../models/DemoRequest');
    const demoRequest = await DemoRequest.create({
      lead: leadId,
      clientName,
      mobileNumber,
      description,
      reference,
      requestedBy: salesId,
      priority: lead.priority === 'urgent' ? 'high' : 'medium'
    });

    // Update lead status to demo_requested
    lead.status = 'demo_requested';
    lead.lastContactDate = new Date();
    await lead.save();

    // Add activity log
    lead.activities.push({
      type: 'status_change',
      description: `Demo requested for ${clientName} - ${description || 'No description provided'}`,
      performedBy: salesId,
      timestamp: new Date()
    });
    await lead.save();

    // Update sales employee's lead statistics
    const sales = await Sales.findById(salesId);
    await sales.updateLeadStats();

    res.status(201).json({
      success: true,
      message: 'Demo request submitted successfully',
      data: demoRequest
    });

  } catch (error) {
    console.error('Request demo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while requesting demo'
    });
  }
};

// @desc    Transfer lead to another sales employee
// @route   POST /api/sales/leads/:id/transfer
// @access  Private (Sales only)
const transferLead = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const leadId = req.params.id;
    const { toSalesId, reason } = req.body;

    // Validate required fields
    if (!toSalesId) {
      return res.status(400).json({
        success: false,
        message: 'Target sales employee ID is required'
      });
    }

    // Find lead and verify ownership
    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: salesId 
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    // Verify target sales employee exists
    const targetSales = await Sales.findById(toSalesId);
    if (!targetSales) {
      return res.status(404).json({
        success: false,
        message: 'Target sales employee not found'
      });
    }

    // Transfer lead
    await lead.transferToSales(salesId, toSalesId, reason);

    // Update both sales employees' lead statistics
    const fromSales = await Sales.findById(salesId);
    const toSales = await Sales.findById(toSalesId);
    
    await fromSales.updateLeadStats();
    await toSales.updateLeadStats();

    // Add activity log
    lead.activities.push({
      type: 'status_change',
      description: `Lead transferred to ${targetSales.name}${reason ? ` - ${reason}` : ''}`,
      performedBy: salesId,
      timestamp: new Date()
    });
    await lead.save();

    // Populate for response
    await lead.populate('assignedTo', 'name email');
    await lead.populate('leadProfile', 'name businessName projectType estimatedCost quotationSent demoSent');

    res.status(200).json({
      success: true,
      message: 'Lead transferred successfully',
      data: lead
    });

  } catch (error) {
    console.error('Transfer lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while transferring lead'
    });
  }
};

// @desc    Add note to lead profile
// @route   POST /api/sales/leads/:id/notes
// @access  Private (Sales only)
const addNoteToLead = async (req, res) => {
  try {
    const salesId = req.sales.id;
    const leadId = req.params.id;
    const { content } = req.body;

    // Validate required fields
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    // Find lead and verify ownership
    const lead = await Lead.findOne({ 
      _id: leadId, 
      assignedTo: salesId 
    }).populate('leadProfile');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or not assigned to you'
      });
    }

    if (!lead.leadProfile) {
      return res.status(400).json({
        success: false,
        message: 'Lead profile not found. Please create a profile first.'
      });
    }

    // Add note to lead profile
    const LeadProfile = require('../models/LeadProfile');
    const leadProfile = await LeadProfile.findById(lead.leadProfile._id);
    
    await leadProfile.addNote(content.trim(), salesId);

    // Add activity log
    lead.activities.push({
      type: 'note',
      description: `Note added: ${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}`,
      performedBy: salesId,
      timestamp: new Date()
    });
    lead.lastContactDate = new Date();
    await lead.save();

    // Populate for response
    await leadProfile.populate('notes.addedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: leadProfile
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding note'
    });
  }
};

// @desc    Get client profile with project details
// @route   GET /api/sales/clients/:id/profile
// @access  Private (Sales only - only converter can access)
const getClientProfile = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const clientId = req.params.id;

    // Find client and verify it was converted by this sales employee
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Verify access - only the sales employee who converted can access
    if (!client.convertedBy || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this client'
      });
    }

    // Find associated project(s) for this client
    // Reload project to ensure we have latest financialDetails updated by PaymentReceipt hook
    const projects = await Project.find({ client: clientId })
      .select('name description status progress projectType financialDetails budget startDate dueDate finishedDays installmentPlan')
      .sort({ createdAt: -1 });

    // Use primary project (most recent or first one)
    let primaryProject = projects[0] || null;
    
    // Reload project with fresh data to ensure financialDetails are up-to-date
    if (primaryProject) {
      primaryProject = await Project.findById(primaryProject._id)
        .select('name description status progress projectType financialDetails budget startDate dueDate finishedDays installmentPlan');
    }

    // Calculate financial summary from primary project
    let totalCost = 0;
    let advanceReceived = 0;
    let pending = 0;
    let workProgress = 0;
    let status = 'N/A';
    let projectType = 'N/A';
    let startDate = null;
    let expectedCompletion = null;
    
    // Variables for detailed breakdown
    let initialAdvance = 0;
    let totalApprovedPayments = 0;
    let paidInstallmentAmount = 0;
    let totalFromReceiptsAndInstallments = 0;

    if (primaryProject) {
      totalCost = primaryProject.financialDetails?.totalCost || primaryProject.budget || 0;
      
      // Recalculate from actual payment sources to ensure accuracy
      // This matches the logic used in recalculateProjectFinancials and PaymentReceipt hook
      const PaymentReceipt = require('../models/PaymentReceipt');
      const approvedReceipts = await PaymentReceipt.find({
        project: primaryProject._id,
        status: 'approved'
      }).select('amount');
      
      totalApprovedPayments = approvedReceipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
      
      // Calculate paid installments
      const installmentPlan = primaryProject.installmentPlan || [];
      const paidInstallments = installmentPlan.filter(inst => inst.status === 'paid');
      paidInstallmentAmount = paidInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
      
      // Get stored advanceReceived (might include initial advance)
      const storedAdvance = Number(primaryProject.financialDetails?.advanceReceived || 0);
      totalFromReceiptsAndInstallments = totalApprovedPayments + paidInstallmentAmount;
      
      // Calculate initial advance (the amount set during conversion, before any receipts/installments)
      // If stored advance > receipts+installments, the difference is initial advance
      if (storedAdvance > totalFromReceiptsAndInstallments) {
        initialAdvance = storedAdvance - totalFromReceiptsAndInstallments;
      } else if (storedAdvance > 0 && totalFromReceiptsAndInstallments === 0) {
        // No receipts/installments yet, stored is initial advance
        initialAdvance = storedAdvance;
      } else {
        // Initial advance might be 0 or already included
        initialAdvance = 0;
      }
      
      // Calculate total received using same logic as recalculateProjectFinancials
      if (storedAdvance >= totalFromReceiptsAndInstallments) {
        // Stored advance already includes everything
        advanceReceived = storedAdvance;
      } else if (storedAdvance > 0 && totalFromReceiptsAndInstallments > storedAdvance) {
        // Stored is initial advance, receipts+installments are additional
        advanceReceived = storedAdvance + totalFromReceiptsAndInstallments;
      } else {
        // No initial advance or already included - use receipts+installments
        advanceReceived = totalFromReceiptsAndInstallments;
      }
      
      // Calculate pending amount
      pending = Math.max(0, totalCost - advanceReceived);
      
      // Update project's financialDetails if different (for consistency)
      const tolerance = 0.01;
      const needsUpdate = 
        Math.abs((primaryProject.financialDetails?.remainingAmount || 0) - pending) > tolerance ||
        Math.abs((primaryProject.financialDetails?.advanceReceived || 0) - advanceReceived) > tolerance ||
        Math.abs((primaryProject.financialDetails?.totalCost || 0) - totalCost) > tolerance;
      
      if (needsUpdate) {
        try {
          primaryProject.financialDetails = primaryProject.financialDetails || {};
          primaryProject.financialDetails.advanceReceived = advanceReceived;
          primaryProject.financialDetails.remainingAmount = pending;
          primaryProject.financialDetails.totalCost = totalCost;
          await primaryProject.save();
        } catch (updateError) {
          console.error('Error updating project financials in getClientProfile:', updateError);
          // Continue with calculated values even if save fails
        }
      }
      
      workProgress = primaryProject.progress || 0;
      status = primaryProject.status || 'N/A';
      
      // Format project type
      const pt = primaryProject.projectType || {};
      if (pt.web) projectType = 'Web';
      else if (pt.app) projectType = 'App';
      else if (pt.taxi) projectType = 'Taxi';
      else projectType = 'N/A';

      startDate = primaryProject.startDate;
      expectedCompletion = primaryProject.dueDate;
    }

    // Generate avatar from name
    const avatar = client.name ? client.name.charAt(0).toUpperCase() : 'C';

    res.status(200).json({
      success: true,
      data: {
        client: {
          id: client._id,
          name: client.name,
          phone: client.phoneNumber,
          avatar: avatar,
          company: client.companyName || ''
        },
        financial: {
          totalCost,
          advanceReceived,
          pending,
          // Detailed breakdown for better clarity
          breakdown: {
            initialAdvance: initialAdvance,
            fromReceipts: totalApprovedPayments,
            fromInstallments: paidInstallmentAmount,
            totalPaid: advanceReceived
          }
        },
        project: {
          workProgress,
          status,
          projectType,
          startDate,
          expectedCompletion,
          projectDetails: primaryProject
        },
        allProjects: projects
      }
    });
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client profile'
    });
  }
};

// @desc    Create payment receipt for client
// @route   POST /api/sales/clients/:clientId/payments
// @access  Private (Sales only - only converter can access)
const createClientPayment = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const clientId = req.params.clientId;
    const { amount, accountId, method = 'upi', referenceId, notes } = req.body;

    // Validate required fields
    if (!amount || !accountId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and account are required'
      });
    }

    // Find client and verify access
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.convertedBy || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this client'
      });
    }

    // Find primary project for this client
    const project = await Project.findOne({ client: clientId })
      .sort({ createdAt: -1 });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'No project found for this client'
      });
    }

    // Verify account exists
    const account = await Account.findById(accountId);
    if (!account || !account.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or inactive'
      });
    }

    // Create payment receipt
    const receipt = await PaymentReceipt.create({
      client: client._id,
      project: project._id,
      amount: parseFloat(amount),
      account: accountId,
      method,
      referenceId: referenceId || undefined,
      notes: notes || undefined,
      createdBy: salesId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: receipt,
      message: 'Payment receipt created and pending verification'
    });
  } catch (error) {
    console.error('Create client payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment receipt'
    });
  }
};

// @desc    Create project request (accelerate/hold work)
// @route   POST /api/sales/clients/:clientId/project-requests
// @access  Private (Sales only - only converter can access)
const createProjectRequest = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const clientId = req.params.clientId;
    const { requestType, reason } = req.body;

    // Validate required fields
    if (!requestType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Request type and reason are required'
      });
    }

    if (!['accelerate_work', 'hold_work'].includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type. Must be accelerate_work or hold_work'
      });
    }

    // Find client and verify access
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.convertedBy || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this client'
      });
    }

    // Find primary project for this client
    const project = await Project.findOne({ client: clientId })
      .sort({ createdAt: -1 });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'No project found for this client'
      });
    }

    // Create request
    const request = await Request.create({
      module: 'sales',
      requestType,
      client: client._id,
      project: project._id,
      reason: reason.trim(),
      requestedBy: salesId,
      requestedByModel: 'Sales',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: request,
      message: 'Request created successfully'
    });
  } catch (error) {
    console.error('Create project request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project request'
    });
  }
};

// @desc    Get project requests for client
// @route   GET /api/sales/clients/:clientId/project-requests
// @access  Private (Sales only - only converter can access)
const getProjectRequests = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const clientId = req.params.clientId;

    // Find client and verify access
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.convertedBy || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this client'
      });
    }

    // Fetch requests for this client
    const requests = await Request.find({
      client: clientId,
      module: 'sales'
    })
      .populate('project', 'name status')
      .populate('requestedBy', 'name email')
      .populate('handledBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      message: 'Requests fetched successfully'
    });
  } catch (error) {
    console.error('Get project requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project requests'
    });
  }
};

// @desc    Increase project cost
// @route   POST /api/sales/clients/:clientId/increase-cost
// @access  Private (Sales only - only converter can access)
const increaseProjectCost = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const clientId = req.params.clientId;
    const { amount, reason } = req.body;

    // Validate required fields
    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Amount and reason are required'
      });
    }

    const increaseAmount = parseFloat(amount);
    if (isNaN(increaseAmount) || increaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Find client and verify access
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.convertedBy || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this client'
      });
    }

    // Find primary project for this client
    const project = await Project.findOne({ client: clientId })
      .sort({ createdAt: -1 });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'No project found for this client'
      });
    }

    // Store previous cost for history
    const previousCost = project.financialDetails?.totalCost || project.budget || 0;
    const newCost = previousCost + increaseAmount;

    // Update financial details
    const currentAdvanceReceived = project.financialDetails?.advanceReceived || 0;
    project.financialDetails = {
      totalCost: newCost,
      advanceReceived: currentAdvanceReceived,
      includeGST: project.financialDetails?.includeGST || false,
      remainingAmount: newCost - currentAdvanceReceived
    };

    // Update budget
    project.budget = newCost;

    // Add to cost history
    if (!project.costHistory) {
      project.costHistory = [];
    }
    project.costHistory.push({
      previousCost,
      newCost,
      reason: reason.trim(),
      changedBy: salesId,
      changedByModel: 'Sales',
      changedAt: new Date()
    });

    await project.save();

    res.status(200).json({
      success: true,
      data: {
        project: {
          _id: project._id,
          financialDetails: project.financialDetails,
          budget: project.budget
        },
        costIncrease: increaseAmount,
        previousCost,
        newCost
      },
      message: 'Project cost increased successfully'
    });
  } catch (error) {
    console.error('Increase project cost error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increase project cost'
    });
  }
};

// @desc    Transfer client to another sales employee
// @route   POST /api/sales/clients/:clientId/transfer
// @access  Private (Sales only - only converter can access)
const transferClient = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const clientId = req.params.clientId;
    const { toSalesId, reason } = req.body;

    // Validate required fields
    if (!toSalesId) {
      return res.status(400).json({
        success: false,
        message: 'Target sales employee ID is required'
      });
    }

    // Find client and verify access
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.convertedBy || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this client'
      });
    }

    // Verify target sales employee exists
    const targetSales = await Sales.findById(toSalesId);
    if (!targetSales) {
      return res.status(404).json({
        success: false,
        message: 'Target sales employee not found'
      });
    }

    // Prevent transferring to self
    if (String(toSalesId) === String(salesId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer client to yourself'
      });
    }

    // Initialize transferHistory if it doesn't exist
    if (!client.transferHistory) {
      client.transferHistory = [];
    }

    // Add transfer history entry
    client.transferHistory.push({
      fromSales: client.convertedBy,
      toSales: toSalesId,
      reason: reason ? reason.trim() : undefined,
      transferredAt: new Date(),
      transferredBy: salesId
    });

    // Update convertedBy
    client.convertedBy = toSalesId;
    await client.save();

    res.status(200).json({
      success: true,
      data: {
        client: {
          _id: client._id,
          name: client.name,
          convertedBy: client.convertedBy
        },
        transfer: {
          fromSales: salesId,
          toSales: toSalesId
        }
      },
      message: 'Client transferred successfully'
    });
  } catch (error) {
    console.error('Transfer client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer client'
    });
  }
};

// @desc    Mark project as completed (No Dues)
// @route   POST /api/sales/clients/:clientId/mark-completed
// @access  Private (Sales only - only converter can access)
const markProjectCompleted = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const clientId = req.params.clientId;

    // Find client and verify access
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.convertedBy || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this client'
      });
    }

    // Find primary project for this client
    const project = await Project.findOne({ client: clientId })
      .sort({ createdAt: -1 });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'No project found for this client'
      });
    }

    // Check if all payments are received
    const remainingAmount = project.financialDetails?.remainingAmount || 0;
    if (remainingAmount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as completed. Remaining amount: ₹${remainingAmount.toLocaleString()}`
      });
    }

    // Update project status
    project.status = 'completed';
    await project.save();

    res.status(200).json({
      success: true,
      data: {
        project: {
          _id: project._id,
          name: project.name,
          status: project.status
        }
      },
      message: 'Project marked as completed successfully'
    });
  } catch (error) {
    console.error('Mark project completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark project as completed'
    });
  }
};

// @desc    Get transaction history for client
// @route   GET /api/sales/clients/:clientId/transactions
// @access  Private (Sales only - only converter can access)
const getClientTransactions = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);
    const clientId = req.params.clientId;

    // Find client and verify access
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.convertedBy || String(client.convertedBy) !== String(salesId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this client'
      });
    }

    // Find all projects for this client
    const projects = await Project.find({ client: clientId }).select('_id name');
    const projectIds = projects.map(p => p._id);

    // Fetch all payment receipts for these projects
    const transactions = await PaymentReceipt.find({
      project: { $in: projectIds }
    })
      .populate('project', 'name')
      .populate('account', 'name bankName accountNumber ifsc upiId')
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transactions,
      message: 'Transactions fetched successfully'
    });
  } catch (error) {
    console.error('Get client transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};

// @desc    Get sales wallet summary
// @route   GET /api/sales/wallet/summary
// @access  Private (Sales only)
const getWalletSummary = async (req, res) => {
  try {
    const salesId = safeObjectId(req.sales.id);

    // Load sales employee for salary and per-client incentive
    const me = await Sales.findById(salesId).select('fixedSalary incentivePerClient name');
    const perClient = Number(me?.incentivePerClient || 0);
    const fixedSalary = Number(me?.fixedSalary || 0);

    // Get conversion-based incentives from Incentive model
    const Incentive = require('../models/Incentive');
    const conversionIncentives = await Incentive.find({
      salesEmployee: salesId,
      isConversionBased: true
    })
      .populate('clientId', 'name')
      .populate('projectId', 'name status financialDetails')
      .populate('leadId', 'phone')
      .sort({ dateAwarded: -1 });

    // Calculate totals from actual incentive records
    let totalIncentive = 0;
    let current = 0;
    let pending = 0;
    const breakdown = [];

    conversionIncentives.forEach(incentive => {
      totalIncentive += incentive.amount;
      current += incentive.currentBalance || 0;
      pending += incentive.pendingBalance || 0;

      breakdown.push({
        incentiveId: incentive._id,
        clientId: incentive.clientId?._id || null,
        clientName: incentive.clientId?.name || 'Unknown Client',
        projectId: incentive.projectId?._id || null,
        projectName: incentive.projectId?.name || null,
        isNoDues: incentive.projectId?.status === 'completed' && 
                  Number(incentive.projectId?.financialDetails?.remainingAmount || 0) === 0,
        convertedAt: incentive.dateAwarded || null,
        amount: incentive.amount,
        currentBalance: incentive.currentBalance || 0,
        pendingBalance: incentive.pendingBalance || 0
      });
    });

    // Calculate monthly incentive (based on incentives created in current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthlyIncentives = conversionIncentives.filter(inc => {
      const dateAwarded = new Date(inc.dateAwarded);
      return dateAwarded >= monthStart && dateAwarded <= monthEnd;
    });
    const monthly = monthlyIncentives.reduce((sum, inc) => sum + (inc.amount || 0), 0);

    const allTime = totalIncentive;

    // Transactions view: incentive records + salary (current month)
    const transactions = breakdown
      .map(b => ({
        id: b.incentiveId.toString(),
        type: 'incentive',
        amount: b.amount,
        date: b.convertedAt || me?.createdAt || new Date(),
        clientName: b.clientName,
        currentBalance: b.currentBalance,
        pendingBalance: b.pendingBalance
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Salary credit for this month (computed record)
    const salaryTxDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (fixedSalary > 0) {
      transactions.unshift({
        id: `salary-${salaryTxDate.toISOString()}`,
        type: 'salary',
        amount: fixedSalary,
        date: salaryTxDate
      });
    }

    res.status(200).json({
      success: true,
      data: {
        salary: { fixedSalary },
        incentive: {
          perClient, // Keep for backward compatibility
          current,
          pending,
          monthly,
          allTime,
          breakdown
        },
        transactions
      }
    });
  } catch (error) {
    console.error('Get wallet summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet summary' });
  }
};

module.exports = {
  loginSales,
  getSalesProfile,
  logoutSales,
  createDemoSales,
  createLeadBySales,
  getLeadCategories,
  debugLeads,
  getTileCardStats,
  getDashboardHeroStats,
  getSalesDashboardStats,
  // alias export for new route path
  getDashboardStats: getSalesDashboardStats,
  getMonthlyConversions,
  getMyLeads,
  getLeadsByStatus,
  getLeadDetail,
  updateLeadStatus,
  createLeadProfile,
  updateLeadProfile,
  convertLeadToClient,
  getSalesTeam,
  requestDemo,
  transferLead,
  addNoteToLead,
  getAccounts,
  getPaymentRecovery,
  getPaymentRecoveryStats,
  createPaymentReceipt,
  getProjectInstallments,
  requestInstallmentPayment,
  getDemoRequests,
  updateDemoRequestStatus,
  listSalesTasks,
  createSalesTask,
  updateSalesTask,
  toggleSalesTask,
  deleteSalesTask,
  listSalesMeetings,
  createSalesMeeting,
  updateSalesMeeting,
  deleteSalesMeeting,
  getMyConvertedClients,
  getWalletSummary,
  getClientProfile,
  createClientPayment,
  createProjectRequest,
  getProjectRequests,
  increaseProjectCost,
  transferClient,
  markProjectCompleted,
  getClientTransactions
};
