const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const Admin = require('../models/Admin');
const PM = require('../models/PM');
const Sales = require('../models/Sales');
const Employee = require('../models/Employee');
const Client = require('../models/Client');

// Helper function to get month name
const getMonthName = (date) => {
  return date.toLocaleString('default', { month: 'short' });
};

// @desc    Get dashboard overview
// @route   GET /api/master-admin/analytics/dashboard
// @access  Private (Master Admin only)
const getDashboardOverview = async (req, res) => {
  try {
    // Total users
    const totalUsers = 
      (await Admin.countDocuments({ isActive: true })) +
      (await PM.countDocuments({ isActive: true })) +
      (await Sales.countDocuments({ isActive: true })) +
      (await Employee.countDocuments({ isActive: true })) +
      (await Client.countDocuments({ isActive: true }));

    // Active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // Total revenue (from active subscriptions)
    const subscriptions = await Subscription.find({ status: 'active' });
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

    // Total companies
    const totalCompanies = await Company.countDocuments({ isActive: true });

    // Monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySubscriptions = await Subscription.find({
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { nextBillingDate: { $gte: startOfMonth, $lte: now } },
        { createdAt: { $gte: startOfMonth } }
      ]
    });
    const monthlyRevenue = monthlySubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

    // Calculate monthly growth (simplified - compare with previous month)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const previousMonthSubscriptions = await Subscription.find({
      status: 'active',
      createdAt: { $gte: previousMonth, $lte: previousMonthEnd }
    });
    const previousMonthRevenue = previousMonthSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const monthlyGrowth = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Active modules (always 5 for now)
    const activeModules = 5;

    // System health (simplified - based on active subscriptions)
    const systemHealth = activeSubscriptions > 0 ? 98.5 : 0;

    // Churn rate (cancelled subscriptions in last month / total active)
    const lastMonthCancelled = await Subscription.countDocuments({
      status: 'cancelled',
      cancelledAt: { $gte: previousMonth }
    });
    const churnRate = activeSubscriptions > 0 
      ? (lastMonthCancelled / activeSubscriptions) * 100 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeSubscriptions,
          totalRevenue,
          monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
          activeModules,
          systemHealth,
          totalCompanies,
          monthlyRevenue,
          churnRate: Math.round(churnRate * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard overview'
    });
  }
};

// @desc    Get revenue trend
// @route   GET /api/master-admin/analytics/revenue-trend
// @access  Private (Master Admin only)
const getRevenueTrend = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const revenueTrend = [];

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      // Get subscriptions active during this month
      const monthSubscriptions = await Subscription.find({
        status: 'active',
        startDate: { $lte: monthEnd },
        $or: [
          { nextBillingDate: { $gte: monthDate, $lte: monthEnd } },
          { createdAt: { $gte: monthDate, $lte: monthEnd } }
        ]
      });

      const revenue = monthSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
      const subscriptions = monthSubscriptions.length;

      revenueTrend.push({
        month: getMonthName(monthDate),
        revenue,
        subscriptions
      });
    }

    res.status(200).json({
      success: true,
      data: { revenueTrend }
    });

  } catch (error) {
    console.error('Get revenue trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching revenue trend'
    });
  }
};

// @desc    Get module statistics
// @route   GET /api/master-admin/analytics/modules
// @access  Private (Master Admin only)
const getModuleStatistics = async (req, res) => {
  try {
    // For now, we'll estimate module usage based on user roles
    // Sales CRM - Sales users
    const salesUsers = await Sales.countDocuments({ isActive: true });
    const salesRevenue = salesUsers * 750; // Estimated revenue per user

    // PM Cloud - PM users
    const pmUsers = await PM.countDocuments({ isActive: true });
    const pmRevenue = pmUsers * 750;

    // People Ops - Employee users
    const employeeUsers = await Employee.countDocuments({ isActive: true });
    const employeeRevenue = employeeUsers * 750;

    // Admin HQ - Admin users
    const adminUsers = await Admin.countDocuments({ isActive: true });
    const adminRevenue = adminUsers * 1500;

    // Client Portal - Client users
    const clientUsers = await Client.countDocuments({ isActive: true });
    const clientRevenue = clientUsers * 6243.75;

    const modules = [
      {
        id: 1,
        name: 'Sales CRM',
        status: 'active',
        users: salesUsers,
        revenue: salesRevenue,
        growth: 8.2 // Placeholder
      },
      {
        id: 2,
        name: 'PM Cloud',
        status: 'active',
        users: pmUsers,
        revenue: pmRevenue,
        growth: 15.3 // Placeholder
      },
      {
        id: 3,
        name: 'People Ops',
        status: 'active',
        users: employeeUsers,
        revenue: employeeRevenue,
        growth: 5.7 // Placeholder
      },
      {
        id: 4,
        name: 'Admin HQ',
        status: 'active',
        users: adminUsers,
        revenue: adminRevenue,
        growth: 22.1 // Placeholder
      },
      {
        id: 5,
        name: 'Client Portal',
        status: 'active',
        users: clientUsers,
        revenue: clientRevenue,
        growth: 18.9 // Placeholder
      }
    ];

    res.status(200).json({
      success: true,
      data: { modules }
    });

  } catch (error) {
    console.error('Get module statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching module statistics'
    });
  }
};

// @desc    Get plan distribution
// @route   GET /api/master-admin/analytics/plan-distribution
// @access  Private (Master Admin only)
const getPlanDistribution = async (req, res) => {
  try {
    const premiumCount = await Subscription.countDocuments({ plan: 'Premium', status: 'active' });
    const professionalCount = await Subscription.countDocuments({ plan: 'Professional', status: 'active' });
    const starterCount = await Subscription.countDocuments({ plan: 'Starter', status: 'active' });

    const total = premiumCount + professionalCount + starterCount;

    const planDistribution = [
      {
        name: 'Premium',
        value: total > 0 ? Math.round((premiumCount / total) * 100) : 0,
        color: '#14b8a6',
        count: premiumCount
      },
      {
        name: 'Professional',
        value: total > 0 ? Math.round((professionalCount / total) * 100) : 0,
        color: '#3b82f6',
        count: professionalCount
      },
      {
        name: 'Starter',
        value: total > 0 ? Math.round((starterCount / total) * 100) : 0,
        color: '#10b981',
        count: starterCount
      }
    ];

    res.status(200).json({
      success: true,
      data: { planDistribution }
    });

  } catch (error) {
    console.error('Get plan distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching plan distribution'
    });
  }
};

// @desc    Get company growth
// @route   GET /api/master-admin/analytics/company-growth
// @access  Private (Master Admin only)
const getCompanyGrowth = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const growth = [];

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const companiesJoined = await Company.countDocuments({
        joinedDate: { $gte: monthDate, $lte: monthEnd }
      });

      growth.push({
        month: getMonthName(monthDate),
        companies: companiesJoined
      });
    }

    res.status(200).json({
      success: true,
      data: { growth }
    });

  } catch (error) {
    console.error('Get company growth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company growth'
    });
  }
};

// @desc    Get user growth
// @route   GET /api/master-admin/analytics/user-growth
// @access  Private (Master Admin only)
const getUserGrowth = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const growth = [];

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const adminUsers = await Admin.countDocuments({
        createdAt: { $gte: monthDate, $lte: monthEnd }
      });
      const pmUsers = await PM.countDocuments({
        createdAt: { $gte: monthDate, $lte: monthEnd }
      });
      const salesUsers = await Sales.countDocuments({
        createdAt: { $gte: monthDate, $lte: monthEnd }
      });
      const employeeUsers = await Employee.countDocuments({
        createdAt: { $gte: monthDate, $lte: monthEnd }
      });
      const clientUsers = await Client.countDocuments({
        createdAt: { $gte: monthDate, $lte: monthEnd }
      });

      const totalUsers = adminUsers + pmUsers + salesUsers + employeeUsers + clientUsers;

      growth.push({
        month: getMonthName(monthDate),
        users: totalUsers
      });
    }

    res.status(200).json({
      success: true,
      data: { growth }
    });

  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user growth'
    });
  }
};

module.exports = {
  getDashboardOverview,
  getRevenueTrend,
  getModuleStatistics,
  getPlanDistribution,
  getCompanyGrowth,
  getUserGrowth
};


