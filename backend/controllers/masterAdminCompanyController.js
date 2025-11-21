const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const { createLog } = require('../utils/activityLogger');

// @desc    Create new company
// @route   POST /api/master-admin/companies
// @access  Private (Master Admin only)
const createCompany = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      industry,
      status,
      plan,
      website,
      description
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and phone'
      });
    }

    // Check if company with email already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this email already exists'
      });
    }

    // Create company
    const company = await Company.create({
      name,
      email,
      phone,
      address,
      industry,
      status: status || 'trial',
      plan: plan || 'Starter',
      website,
      description
    });

    // Log company creation
    await createLog(
      'company',
      'Created new company',
      company.name,
      req.masterAdmin.name,
      'success',
      { companyId: company._id, email: company.email },
      req.ip,
      req.get('user-agent')
    );

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: { company }
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating company'
    });
  }
};

// @desc    Get all companies
// @route   GET /api/master-admin/companies
// @access  Private (Master Admin only)
const getAllCompanies = async (req, res) => {
  try {
    const { search, status, plan, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }
    if (plan) {
      query.plan = plan;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get companies with pagination
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Company.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching companies'
    });
  }
};

// @desc    Get company by ID
// @route   GET /api/master-admin/companies/:id
// @access  Private (Master Admin only)
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get company subscriptions
    const subscriptions = await Subscription.find({ company: company._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        company,
        subscriptions
      }
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company'
    });
  }
};

// @desc    Update company
// @route   PUT /api/master-admin/companies/:id
// @access  Private (Master Admin only)
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Update fields
    const {
      name,
      email,
      phone,
      address,
      industry,
      status,
      plan,
      website,
      description
    } = req.body;

    if (name) company.name = name;
    if (email) company.email = email;
    if (phone) company.phone = phone;
    if (address) company.address = address;
    if (industry) company.industry = industry;
    if (status) company.status = status;
    if (plan) company.plan = plan;
    if (website) company.website = website;
    if (description) company.description = description;

    await company.save();

    // Log company update
    await createLog(
      'company',
      'Updated company information',
      company.name,
      req.masterAdmin.name,
      'success',
      { companyId: company._id, updatedFields: Object.keys(req.body) },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: { company }
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating company'
    });
  }
};

// @desc    Delete company (soft delete)
// @route   DELETE /api/master-admin/companies/:id
// @access  Private (Master Admin only)
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Soft delete - set isActive to false
    company.isActive = false;
    await company.save();

    // Log company deletion
    await createLog(
      'company',
      'Deleted company',
      company.name,
      req.masterAdmin.name,
      'success',
      { companyId: company._id },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting company'
    });
  }
};

// @desc    Get company statistics
// @route   GET /api/master-admin/companies/statistics
// @access  Private (Master Admin only)
const getCompanyStatistics = async (req, res) => {
  try {
    const total = await Company.countDocuments({ isActive: true });
    const active = await Company.countDocuments({ status: 'active', isActive: true });
    const trial = await Company.countDocuments({ status: 'trial', isActive: true });
    const suspended = await Company.countDocuments({ status: 'suspended', isActive: true });

    // Calculate total users and revenue
    const companies = await Company.find({ isActive: true });
    const totalUsers = companies.reduce((sum, c) => sum + (c.totalUsers || 0), 0);
    const totalRevenue = companies.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        trial,
        suspended,
        totalUsers,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Get company statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company statistics'
    });
  }
};

// @desc    Suspend company
// @route   PATCH /api/master-admin/companies/:id/suspend
// @access  Private (Master Admin only)
const suspendCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    company.status = 'suspended';
    await company.save();

    // Suspend all active subscriptions
    await Subscription.updateMany(
      { company: company._id, status: 'active' },
      { status: 'suspended' }
    );

    // Log suspension
    await createLog(
      'company',
      'Suspended company',
      company.name,
      req.masterAdmin.name,
      'warning',
      { companyId: company._id },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Company suspended successfully',
      data: { company }
    });

  } catch (error) {
    console.error('Suspend company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while suspending company'
    });
  }
};

// @desc    Activate company
// @route   PATCH /api/master-admin/companies/:id/activate
// @access  Private (Master Admin only)
const activateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    company.status = 'active';
    await company.save();

    // Activate suspended subscriptions
    await Subscription.updateMany(
      { company: company._id, status: 'suspended' },
      { status: 'active' }
    );

    // Log activation
    await createLog(
      'company',
      'Activated company',
      company.name,
      req.masterAdmin.name,
      'success',
      { companyId: company._id },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Company activated successfully',
      data: { company }
    });

  } catch (error) {
    console.error('Activate company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating company'
    });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyStatistics,
  suspendCompany,
  activateCompany
};


