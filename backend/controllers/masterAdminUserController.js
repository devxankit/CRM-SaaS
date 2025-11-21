const Admin = require('../models/Admin');
const PM = require('../models/PM');
const Sales = require('../models/Sales');
const Employee = require('../models/Employee');
const Client = require('../models/Client');
const Company = require('../models/Company');
const { createLog } = require('../utils/activityLogger');

// Helper function to get user model by role
const getUserModel = (role) => {
  switch (role) {
    case 'admin':
    case 'hr':
      return Admin;
    case 'project-manager':
      return PM;
    case 'sales':
      return Sales;
    case 'employee':
      return Employee;
    case 'client':
      return Client;
    default:
      return null;
  }
};

// Helper function to format user data
const formatUser = (user, role) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || user.phoneNumber,
    role: role === 'hr' ? 'Admin' : role === 'project-manager' ? 'PM' : role === 'employee' ? 'Employee' : role.charAt(0).toUpperCase() + role.slice(1),
    status: user.isActive ? 'active' : 'inactive',
    lastActive: user.lastLogin || user.createdAt,
    createdAt: user.createdAt
  };
};

// @desc    Get all users across all companies
// @route   GET /api/master-admin/users
// @access  Private (Master Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    let allUsers = [];

    // Get users from each model
    const roles = ['admin', 'hr', 'project-manager', 'sales', 'employee', 'client'];
    const models = [Admin, PM, Sales, Employee, Client];

    // Build query for each model
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const modelRole = roles[i];

      // Skip if role filter is specified and doesn't match
      if (role && role !== modelRole && (modelRole !== 'admin' || role !== 'hr')) {
        continue;
      }

      let query = {};
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await model.find(query).select('-password');
      
      users.forEach(user => {
        const userRole = modelRole === 'admin' && user.role === 'hr' ? 'hr' : modelRole;
        allUsers.push({
          ...formatUser(user, userRole),
          userType: modelRole
        });
      });
    }

    // Also get HR users from Admin model
    if (!role || role === 'hr' || role === 'admin') {
      const hrQuery = { role: 'hr' };
      if (status === 'active') {
        hrQuery.isActive = true;
      } else if (status === 'inactive') {
        hrQuery.isActive = false;
      }
      if (search) {
        hrQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      const hrUsers = await Admin.find(hrQuery).select('-password');
      hrUsers.forEach(user => {
        allUsers.push({
          ...formatUser(user, 'hr'),
          userType: 'admin'
        });
      });
    }

    // Remove duplicates (in case HR users were added twice)
    const uniqueUsers = Array.from(
      new Map(allUsers.map(user => [user.id.toString(), user])).values()
    );

    // Sort by creation date
    uniqueUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const total = uniqueUsers.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = uniqueUsers.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/master-admin/users/:id
// @access  Private (Master Admin only)
const getUserById = async (req, res) => {
  try {
    const { id, userType } = req.params;

    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'User type is required'
      });
    }

    const model = getUserModel(userType);
    if (!model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    const user = await model.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: formatUser(user, user.role || userType)
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/master-admin/users/statistics
// @access  Private (Master Admin only)
const getUserStatistics = async (req, res) => {
  try {
    // Count users by role
    const adminCount = await Admin.countDocuments({ role: 'admin', isActive: true });
    const hrCount = await Admin.countDocuments({ role: 'hr', isActive: true });
    const pmCount = await PM.countDocuments({ isActive: true });
    const salesCount = await Sales.countDocuments({ isActive: true });
    const employeeCount = await Employee.countDocuments({ isActive: true });
    const clientCount = await Client.countDocuments({ isActive: true });

    // Total counts
    const totalActive = adminCount + hrCount + pmCount + salesCount + employeeCount + clientCount;
    const totalInactive = 
      (await Admin.countDocuments({ isActive: false })) +
      (await PM.countDocuments({ isActive: false })) +
      (await Sales.countDocuments({ isActive: false })) +
      (await Employee.countDocuments({ isActive: false })) +
      (await Client.countDocuments({ isActive: false }));

    res.status(200).json({
      success: true,
      data: {
        total: totalActive + totalInactive,
        active: totalActive,
        inactive: totalInactive,
        byRole: {
          admin: adminCount,
          hr: hrCount,
          pm: pmCount,
          sales: salesCount,
          employee: employeeCount,
          client: clientCount
        }
      }
    });

  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
};

// @desc    Get users by company
// @route   GET /api/master-admin/users/company/:companyId
// @access  Private (Master Admin only)
const getUsersByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // For now, return all users (company association will be added in future)
    // This is a placeholder that returns all users
    const allUsers = [];

    const models = [
      { model: Admin, role: 'admin' },
      { model: PM, role: 'project-manager' },
      { model: Sales, role: 'sales' },
      { model: Employee, role: 'employee' },
      { model: Client, role: 'client' }
    ];

    for (const { model, role } of models) {
      const users = await model.find({ isActive: true }).select('-password');
      users.forEach(user => {
        allUsers.push({
          ...formatUser(user, role),
          company: company.name
        });
      });
    }

    res.status(200).json({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          email: company.email
        },
        users: allUsers,
        count: allUsers.length
      }
    });

  } catch (error) {
    console.error('Get users by company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users by company'
    });
  }
};

// @desc    Deactivate user
// @route   PATCH /api/master-admin/users/:id/deactivate
// @access  Private (Master Admin only)
const deactivateUser = async (req, res) => {
  try {
    const { id, userType } = req.params;

    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'User type is required'
      });
    }

    const model = getUserModel(userType);
    if (!model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    const user = await model.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    // Log deactivation
    await createLog(
      'user',
      'Deactivated user',
      user.name,
      req.masterAdmin.name,
      'warning',
      {
        userId: user._id,
        userType,
        email: user.email
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: { user: formatUser(user, user.role || userType) }
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating user'
    });
  }
};

// @desc    Activate user
// @route   PATCH /api/master-admin/users/:id/activate
// @access  Private (Master Admin only)
const activateUser = async (req, res) => {
  try {
    const { id, userType } = req.params;

    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'User type is required'
      });
    }

    const model = getUserModel(userType);
    if (!model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    const user = await model.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    // Log activation
    await createLog(
      'user',
      'Activated user',
      user.name,
      req.masterAdmin.name,
      'success',
      {
        userId: user._id,
        userType,
        email: user.email
      },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: { user: formatUser(user, user.role || userType) }
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating user'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserStatistics,
  getUsersByCompany,
  deactivateUser,
  activateUser
};


