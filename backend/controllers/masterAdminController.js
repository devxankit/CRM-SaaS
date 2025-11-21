const jwt = require('jsonwebtoken');
const MasterAdmin = require('../models/MasterAdmin');
const { createLog } = require('../utils/activityLogger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Login master admin
// @route   POST /api/master-admin/login
// @access  Public
const loginMasterAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if master admin exists and include password for comparison
    const masterAdmin = await MasterAdmin.findOne({ email }).select('+password');
    
    if (!masterAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (masterAdmin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if master admin is active
    if (!masterAdmin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact system administrator.'
      });
    }

    // Check password
    const isPasswordValid = await masterAdmin.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await masterAdmin.incLoginAttempts();
      
      // Log failed login attempt
      await createLog(
        'security',
        'Failed login attempt',
        email,
        'System',
        'warning',
        { email },
        req.ip,
        req.get('user-agent')
      );
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts and update last login
    await masterAdmin.resetLoginAttempts();

    // Generate JWT token
    const token = generateToken(masterAdmin._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Log successful login
    await createLog(
      'security',
      'Master admin logged in',
      masterAdmin.name,
      masterAdmin.name,
      'success',
      { email: masterAdmin.email },
      req.ip,
      req.get('user-agent')
    );

    // Send response with token
    res.status(200)
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        message: 'Login successful',
        data: {
          masterAdmin: {
            id: masterAdmin._id,
            name: masterAdmin.name,
            email: masterAdmin.email,
            role: masterAdmin.role,
            lastLogin: masterAdmin.lastLogin
          },
          token
        }
      });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current master admin profile
// @route   GET /api/master-admin/profile
// @access  Private
const getMasterAdminProfile = async (req, res) => {
  try {
    const masterAdmin = await MasterAdmin.findById(req.masterAdmin.id);
    
    if (!masterAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Master admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        masterAdmin: {
          id: masterAdmin._id,
          name: masterAdmin.name,
          email: masterAdmin.email,
          phone: masterAdmin.phone,
          role: masterAdmin.role,
          isActive: masterAdmin.isActive,
          lastLogin: masterAdmin.lastLogin,
          createdAt: masterAdmin.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update master admin profile
// @route   PUT /api/master-admin/profile
// @access  Private
const updateMasterAdminProfile = async (req, res) => {
  try {
    const { name, phone, dateOfBirth } = req.body;
    const masterAdmin = await MasterAdmin.findById(req.masterAdmin.id);

    if (!masterAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Master admin not found'
      });
    }

    // Update fields
    if (name) masterAdmin.name = name;
    if (phone) masterAdmin.phone = phone;
    if (dateOfBirth) masterAdmin.dateOfBirth = dateOfBirth;

    await masterAdmin.save();

    // Log profile update
    await createLog(
      'user',
      'Updated master admin profile',
      masterAdmin.name,
      masterAdmin.name,
      'success',
      { updatedFields: Object.keys(req.body) },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        masterAdmin: {
          id: masterAdmin._id,
          name: masterAdmin.name,
          email: masterAdmin.email,
          phone: masterAdmin.phone,
          role: masterAdmin.role
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Logout master admin
// @route   POST /api/master-admin/logout
// @access  Private
const logoutMasterAdmin = async (req, res) => {
  try {
    // Log logout
    if (req.masterAdmin) {
      await createLog(
        'security',
        'Master admin logged out',
        req.masterAdmin.name,
        req.masterAdmin.name,
        'info',
        {},
        req.ip,
        req.get('user-agent')
      );
    }

    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

module.exports = {
  loginMasterAdmin,
  getMasterAdminProfile,
  updateMasterAdminProfile,
  logoutMasterAdmin
};


