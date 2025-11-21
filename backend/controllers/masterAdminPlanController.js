const Plan = require('../models/Plan');
const { createLog } = require('../utils/activityLogger');

// @desc    Get all plans
// @route   GET /api/master-admin/plans
// @access  Private (Master Admin only)
const getAllPlans = async (req, res) => {
  try {
    const { active } = req.query;
    const query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }

    const plans = await Plan.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching plans'
    });
  }
};

// @desc    Get plan by ID
// @route   GET /api/master-admin/plans/:id
// @access  Private (Master Admin only)
const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching plan'
    });
  }
};

// @desc    Create plan
// @route   POST /api/master-admin/plans
// @access  Private (Master Admin only)
const createPlan = async (req, res) => {
  try {
    const {
      name,
      statement,
      price,
      period,
      includes,
      extras,
      popular,
      isActive,
      order
    } = req.body;

    // Validate required fields
    if (!name || !statement || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, statement, and price'
      });
    }

    // Check if plan with same name exists
    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan with this name already exists'
      });
    }

    // Check maximum plan limit (3 plans only)
    const planCount = await Plan.countDocuments();
    if (planCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum limit of 3 plans reached. Please delete an existing plan before creating a new one.'
      });
    }

    // Create plan
    const plan = await Plan.create({
      name,
      statement,
      price,
      period: period || '/month',
      includes: includes || [],
      extras: extras || '',
      popular: popular || false,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0
    });

    // Log plan creation
    await createLog(
      'plan',
      'Created subscription plan',
      plan.name,
      req.masterAdmin.name,
      'success',
      {
        planId: plan._id,
        planName: plan.name,
        price: plan.price
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: { plan }
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating plan'
    });
  }
};

// @desc    Update plan
// @route   PUT /api/master-admin/plans/:id
// @access  Private (Master Admin only)
const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const {
      name,
      statement,
      price,
      period,
      includes,
      extras,
      popular,
      isActive,
      order
    } = req.body;

    // Check if name is being changed and if it conflicts with another plan
    if (name && name !== plan.name) {
      const existingPlan = await Plan.findOne({ name });
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Plan with this name already exists'
        });
      }
      plan.name = name;
    }

    // Update fields
    if (statement !== undefined) plan.statement = statement;
    if (price !== undefined) plan.price = price;
    if (period !== undefined) plan.period = period;
    if (includes !== undefined) plan.includes = includes;
    if (extras !== undefined) plan.extras = extras;
    if (popular !== undefined) plan.popular = popular;
    if (isActive !== undefined) plan.isActive = isActive;
    if (order !== undefined) plan.order = order;

    await plan.save();

    // Log plan update
    await createLog(
      'plan',
      'Updated subscription plan',
      plan.name,
      req.masterAdmin.name,
      'success',
      {
        planId: plan._id,
        updatedFields: Object.keys(req.body)
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: { plan }
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating plan'
    });
  }
};

// @desc    Delete plan
// @route   DELETE /api/master-admin/plans/:id
// @access  Private (Master Admin only)
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan is being used in any active subscriptions
    const Subscription = require('../models/Subscription');
    const activeSubscriptions = await Subscription.countDocuments({
      plan: plan.name,
      status: 'active'
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. It is being used by ${activeSubscriptions} active subscription(s). Please deactivate it instead.`
      });
    }

    await Plan.findByIdAndDelete(req.params.id);

    // Log plan deletion
    await createLog(
      'plan',
      'Deleted subscription plan',
      plan.name,
      req.masterAdmin.name,
      'success',
      {
        planId: plan._id,
        planName: plan.name
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting plan'
    });
  }
};

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};

