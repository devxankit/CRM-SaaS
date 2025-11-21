const Subscription = require('../models/Subscription');
const Company = require('../models/Company');
const { createLog } = require('../utils/activityLogger');

// For now, we'll use subscription data as payment records
// In the future, a separate SubscriptionPayment model can be created

// @desc    Get all payments
// @route   GET /api/master-admin/billing/payments
// @access  Private (Master Admin only)
const getAllPayments = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (status) {
      // Map payment status to subscription status
      if (status === 'paid') {
        query.status = 'active';
      } else if (status === 'pending') {
        // Subscriptions with upcoming billing dates
        query.status = 'active';
        query.nextBillingDate = { $gte: new Date() };
      } else if (status === 'failed') {
        query.status = 'suspended';
      } else if (status === 'trial') {
        // Get companies with trial status
        const trialCompanies = await Company.find({ status: 'trial' }).select('_id');
        query.company = { $in: trialCompanies.map(c => c._id) };
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get subscriptions as payment records
    let subscriptions = await Subscription.find(query)
      .populate('company', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by search if provided
    if (search) {
      subscriptions = subscriptions.filter(sub => {
        const companyName = sub.company?.name?.toLowerCase() || '';
        const companyEmail = sub.company?.email?.toLowerCase() || '';
        return companyName.includes(search.toLowerCase()) ||
               companyEmail.includes(search.toLowerCase());
      });
    }

    // Format as payments
    const payments = subscriptions.map(sub => ({
      id: sub._id,
      invoice: `INV-${sub._id.toString().slice(-6).toUpperCase()}`,
      company: sub.company?.name || 'Unknown',
      amount: sub.amount,
      status: sub.status === 'active' ? 'paid' : 
              sub.status === 'suspended' ? 'failed' : 
              sub.status === 'cancelled' ? 'cancelled' : 'pending',
      date: sub.createdAt,
      method: 'Subscription', // Placeholder
      plan: sub.plan,
      nextBilling: sub.nextBillingDate
    }));

    // Get total count
    const total = await Subscription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments'
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/master-admin/billing/payments/:id
// @access  Private (Master Admin only)
const getPaymentById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name email phone address industry')
      .populate('cancelledBy', 'name email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = {
      id: subscription._id,
      invoice: `INV-${subscription._id.toString().slice(-6).toUpperCase()}`,
      company: subscription.company,
      amount: subscription.amount,
      status: subscription.status === 'active' ? 'paid' : 
              subscription.status === 'suspended' ? 'failed' : 
              subscription.status === 'cancelled' ? 'cancelled' : 'pending',
      date: subscription.createdAt,
      method: 'Subscription',
      plan: subscription.plan,
      users: subscription.users,
      billingCycle: subscription.billingCycle,
      nextBilling: subscription.nextBillingDate,
      startDate: subscription.startDate,
      autoRenew: subscription.autoRenew,
      notes: subscription.notes,
      cancelledAt: subscription.cancelledAt,
      cancellationReason: subscription.cancellationReason
    };

    res.status(200).json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment'
    });
  }
};

// @desc    Create payment (record manual payment)
// @route   POST /api/master-admin/billing/payments
// @access  Private (Master Admin only)
const createPayment = async (req, res) => {
  try {
    const { subscriptionId, amount, method, notes } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    const subscription = await Subscription.findById(subscriptionId)
      .populate('company', 'name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription amount if provided
    if (amount) {
      subscription.amount = amount;
    }

    // Update next billing date (mark as paid)
    subscription.nextBillingDate = calculateNextBillingDate(
      subscription.billingCycle,
      new Date()
    );

    await subscription.save();

    // Log payment creation
    await createLog(
      'payment',
      'Recorded manual payment',
      subscription.company.name,
      req.masterAdmin.name,
      'success',
      {
        subscriptionId: subscription._id,
        amount: subscription.amount,
        method: method || 'manual'
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment: {
          id: subscription._id,
          invoice: `INV-${subscription._id.toString().slice(-6).toUpperCase()}`,
          company: subscription.company.name,
          amount: subscription.amount,
          status: 'paid',
          date: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment'
    });
  }
};

// Helper function to calculate next billing date
const calculateNextBillingDate = (billingCycle, startDate) => {
  const date = new Date(startDate);
  switch (billingCycle) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date;
};

// @desc    Update payment
// @route   PUT /api/master-admin/billing/payments/:id
// @access  Private (Master Admin only)
const updatePayment = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const { amount, notes } = req.body;

    if (amount !== undefined) subscription.amount = amount;
    if (notes !== undefined) subscription.notes = notes;

    await subscription.save();

    // Log payment update
    await createLog(
      'payment',
      'Updated payment',
      subscription.company.name,
      req.masterAdmin.name,
      'success',
      {
        subscriptionId: subscription._id,
        updatedFields: Object.keys(req.body)
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: { payment: subscription }
    });

  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment'
    });
  }
};

// @desc    Update payment status
// @route   PATCH /api/master-admin/billing/payments/:id/status
// @access  Private (Master Admin only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Map payment status to subscription status
    if (status === 'paid') {
      subscription.status = 'active';
      subscription.nextBillingDate = calculateNextBillingDate(
        subscription.billingCycle,
        new Date()
      );
    } else if (status === 'failed') {
      subscription.status = 'suspended';
    } else if (status === 'cancelled') {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancelledBy = req.masterAdmin._id;
    }

    await subscription.save();

    // Log status update
    await createLog(
      'payment',
      `Updated payment status to ${status}`,
      subscription.company.name,
      req.masterAdmin.name,
      status === 'paid' ? 'success' : 'warning',
      {
        subscriptionId: subscription._id,
        newStatus: status
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: { payment: subscription }
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status'
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/master-admin/billing/payments/statistics
// @access  Private (Master Admin only)
const getPaymentStatistics = async (req, res) => {
  try {
    const activeSubscriptions = await Subscription.find({ status: 'active' });
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

    const pendingSubscriptions = await Subscription.find({
      status: 'active',
      nextBillingDate: { $gte: new Date() }
    });
    const pendingAmount = pendingSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

    const paidCount = activeSubscriptions.length;
    const failedCount = await Subscription.countDocuments({ status: 'suspended' });
    const cancelledCount = await Subscription.countDocuments({ status: 'cancelled' });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        pendingAmount,
        paidCount,
        failedCount,
        cancelledCount
      }
    });

  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment statistics'
    });
  }
};

// @desc    Get payment history for company
// @route   GET /api/master-admin/billing/payments/company/:companyId
// @access  Private (Master Admin only)
const getPaymentHistory = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const subscriptions = await Subscription.find({ company: companyId })
      .sort({ createdAt: -1 });

    const payments = subscriptions.map(sub => ({
      id: sub._id,
      invoice: `INV-${sub._id.toString().slice(-6).toUpperCase()}`,
      amount: sub.amount,
      status: sub.status === 'active' ? 'paid' : 
              sub.status === 'suspended' ? 'failed' : 
              sub.status === 'cancelled' ? 'cancelled' : 'pending',
      date: sub.createdAt,
      plan: sub.plan,
      nextBilling: sub.nextBillingDate
    }));

    res.status(200).json({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          email: company.email
        },
        payments,
        count: payments.length
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment history'
    });
  }
};

// @desc    Generate invoice
// @route   POST /api/master-admin/billing/payments/:id/invoice
// @access  Private (Master Admin only)
const generateInvoice = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name email phone address')
      .populate('cancelledBy', 'name email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Generate invoice data
    const invoice = {
      invoiceNumber: `INV-${subscription._id.toString().slice(-6).toUpperCase()}`,
      date: new Date(),
      company: subscription.company,
      subscription: {
        plan: subscription.plan,
        amount: subscription.amount,
        users: subscription.users,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        nextBillingDate: subscription.nextBillingDate
      },
      status: subscription.status === 'active' ? 'paid' : 
              subscription.status === 'suspended' ? 'failed' : 
              subscription.status === 'cancelled' ? 'cancelled' : 'pending'
    };

    // Log invoice generation
    await createLog(
      'payment',
      'Generated invoice',
      subscription.company.name,
      req.masterAdmin.name,
      'success',
      {
        subscriptionId: subscription._id,
        invoiceNumber: invoice.invoiceNumber
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Invoice generated successfully',
      data: { invoice }
    });

  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating invoice'
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  getPaymentStatistics,
  getPaymentHistory,
  generateInvoice
};


