const Subscription = require('../models/Subscription');
const Company = require('../models/Company');
const { createLog } = require('../utils/activityLogger');

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

// @desc    Create subscription
// @route   POST /api/master-admin/subscriptions
// @access  Private (Master Admin only)
const createSubscription = async (req, res) => {
  try {
    const {
      company,
      plan,
      amount,
      users,
      billingCycle,
      startDate,
      autoRenew,
      notes
    } = req.body;

    // Validate required fields
    if (!company || !plan || !amount || !users) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company, plan, amount, and users'
      });
    }

    // Check if company exists
    const companyDoc = await Company.findById(company);
    if (!companyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company already has an active subscription
    const existingSubscription = await Subscription.findOne({
      company,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Company already has an active subscription'
      });
    }

    // Calculate next billing date
    const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
    const nextBillingDate = calculateNextBillingDate(
      billingCycle || 'monthly',
      subscriptionStartDate
    );

    // Create subscription
    const subscription = await Subscription.create({
      company,
      plan,
      amount,
      users,
      billingCycle: billingCycle || 'monthly',
      startDate: subscriptionStartDate,
      nextBillingDate,
      autoRenew: autoRenew !== undefined ? autoRenew : true,
      notes
    });

    // Update company plan and status
    companyDoc.plan = plan;
    companyDoc.status = 'active';
    await companyDoc.save();

    // Log subscription creation
    await createLog(
      'subscription',
      'Created subscription',
      companyDoc.name,
      req.masterAdmin.name,
      'success',
      {
        subscriptionId: subscription._id,
        companyId: company,
        plan,
        amount,
        users
      },
      req.ip,
      req.get('user-agent')
    );

    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('company', 'name email');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: { subscription: populatedSubscription }
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating subscription'
    });
  }
};

// @desc    Get all subscriptions
// @route   GET /api/master-admin/subscriptions
// @access  Private (Master Admin only)
const getAllSubscriptions = async (req, res) => {
  try {
    const { search, status, plan, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (plan) {
      query.plan = plan;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get subscriptions with pagination
    let subscriptions = await Subscription.find(query)
      .populate('company', 'name email phone status')
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

    // Get total count
    const total = await Subscription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscriptions'
    });
  }
};

// @desc    Get subscription by ID
// @route   GET /api/master-admin/subscriptions/:id
// @access  Private (Master Admin only)
const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name email phone address industry status plan')
      .populate('cancelledBy', 'name email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { subscription }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscription'
    });
  }
};

// @desc    Update subscription
// @route   PUT /api/master-admin/subscriptions/:id
// @access  Private (Master Admin only)
const updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const {
      plan,
      amount,
      users,
      billingCycle,
      autoRenew,
      notes
    } = req.body;

    // Update fields
    if (plan) subscription.plan = plan;
    if (amount !== undefined) subscription.amount = amount;
    if (users !== undefined) subscription.users = users;
    if (billingCycle) {
      subscription.billingCycle = billingCycle;
      // Recalculate next billing date if billing cycle changes
      subscription.nextBillingDate = calculateNextBillingDate(
        billingCycle,
        subscription.startDate
      );
    }
    if (autoRenew !== undefined) subscription.autoRenew = autoRenew;
    if (notes !== undefined) subscription.notes = notes;

    await subscription.save();

    // Update company plan if changed
    if (plan) {
      const company = await Company.findById(subscription.company._id);
      if (company) {
        company.plan = plan;
        await company.save();
      }
    }

    // Log subscription update
    await createLog(
      'subscription',
      'Updated subscription',
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

    const updatedSubscription = await Subscription.findById(subscription._id)
      .populate('company', 'name email');

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription: updatedSubscription }
    });

  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating subscription'
    });
  }
};

// @desc    Cancel subscription
// @route   PATCH /api/master-admin/subscriptions/:id/cancel
// @access  Private (Master Admin only)
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelledBy = req.masterAdmin._id;
    subscription.cancellationReason = req.body.reason || 'Cancelled by master admin';

    await subscription.save();

    // Log cancellation
    await createLog(
      'subscription',
      'Cancelled subscription',
      subscription.company.name,
      req.masterAdmin.name,
      'warning',
      {
        subscriptionId: subscription._id,
        reason: subscription.cancellationReason
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling subscription'
    });
  }
};

// @desc    Suspend subscription
// @route   PATCH /api/master-admin/subscriptions/:id/suspend
// @access  Private (Master Admin only)
const suspendSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.status = 'suspended';
    await subscription.save();

    // Update company status
    const company = await Company.findById(subscription.company._id);
    if (company) {
      company.status = 'suspended';
      await company.save();
    }

    // Log suspension
    await createLog(
      'subscription',
      'Suspended subscription',
      subscription.company.name,
      req.masterAdmin.name,
      'warning',
      { subscriptionId: subscription._id },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Subscription suspended successfully',
      data: { subscription }
    });

  } catch (error) {
    console.error('Suspend subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while suspending subscription'
    });
  }
};

// @desc    Activate subscription
// @route   PATCH /api/master-admin/subscriptions/:id/activate
// @access  Private (Master Admin only)
const activateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('company', 'name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.status = 'active';
    await subscription.save();

    // Update company status
    const company = await Company.findById(subscription.company._id);
    if (company) {
      company.status = 'active';
      await company.save();
    }

    // Log activation
    await createLog(
      'subscription',
      'Activated subscription',
      subscription.company.name,
      req.masterAdmin.name,
      'success',
      { subscriptionId: subscription._id },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: { subscription }
    });

  } catch (error) {
    console.error('Activate subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating subscription'
    });
  }
};

// @desc    Get subscription statistics
// @route   GET /api/master-admin/subscriptions/statistics
// @access  Private (Master Admin only)
const getSubscriptionStatistics = async (req, res) => {
  try {
    const total = await Subscription.countDocuments();
    const active = await Subscription.countDocuments({ status: 'active' });
    const suspended = await Subscription.countDocuments({ status: 'suspended' });
    const cancelled = await Subscription.countDocuments({ status: 'cancelled' });

    // Calculate revenue
    const activeSubscriptions = await Subscription.find({ status: 'active' });
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

    // Plan distribution
    const starterCount = await Subscription.countDocuments({ plan: 'Starter', status: 'active' });
    const professionalCount = await Subscription.countDocuments({ plan: 'Professional', status: 'active' });
    const premiumCount = await Subscription.countDocuments({ plan: 'Premium', status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        suspended,
        cancelled,
        totalRevenue,
        planDistribution: {
          starter: starterCount,
          professional: professionalCount,
          premium: premiumCount
        }
      }
    });

  } catch (error) {
    console.error('Get subscription statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subscription statistics'
    });
  }
};

// @desc    Get upcoming billings
// @route   GET /api/master-admin/subscriptions/upcoming-billings
// @access  Private (Master Admin only)
const getUpcomingBillings = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const upcomingBillings = await Subscription.find({
      status: 'active',
      nextBillingDate: {
        $gte: new Date(),
        $lte: futureDate
      }
    })
      .populate('company', 'name email phone')
      .sort({ nextBillingDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        upcomingBillings,
        count: upcomingBillings.length
      }
    });

  } catch (error) {
    console.error('Get upcoming billings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming billings'
    });
  }
};

module.exports = {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  suspendSubscription,
  activateSubscription,
  getSubscriptionStatistics,
  getUpcomingBillings
};


