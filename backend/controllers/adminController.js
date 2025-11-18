const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if admin exists and include password for comparison
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact system administrator.'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await admin.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts and update last login
    await admin.resetLoginAttempts();

    // Generate JWT token
    const token = generateToken(admin._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Send response with token
    res.status(200)
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        message: 'Login successful',
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            lastLogin: admin.lastLogin
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

// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt
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

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Private
const logoutAdmin = async (req, res) => {
  try {
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

// @desc    Create demo admin (for development only)
// @route   POST /api/admin/create-demo
// @access  Public (remove in production)
const createDemoAdmin = async (req, res) => {
  try {
    // Check if demo admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@demo.com' });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Demo admin already exists'
      });
    }

    // Create demo admin
    const demoAdmin = await Admin.create({
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: 'password123',
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Demo admin created successfully',
      data: {
        admin: {
          id: demoAdmin._id,
          name: demoAdmin.name,
          email: demoAdmin.email,
          role: demoAdmin.role
        }
      }
    });

  } catch (error) {
    console.error('Create demo admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating demo admin'
    });
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  createDemoAdmin
};
