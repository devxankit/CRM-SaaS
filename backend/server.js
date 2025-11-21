const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables with explicit path resolution
// This ensures it works in both development and production (PM2)
const envPath = path.resolve(__dirname, '.env');
const envResult = require('dotenv').config({ path: envPath });

// Log .env file loading status
if (envResult.error) {
  console.warn('⚠️  WARNING: Could not load .env file:', envResult.error.message);
  console.warn('   Environment variables will be read from system environment or PM2 config');
} else {
  console.log('✅ Loaded .env file from:', envPath);
  console.log('   Environment variables loaded:', Object.keys(envResult.parsed || {}).length, 'variables');
}

// Validate critical environment variables on startup
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI environment variable is not set!');
  console.error('   Please ensure your .env file exists and contains MONGODB_URI');
  console.error('   Or set MONGODB_URI as an environment variable in your PM2 config');
  console.error('   .env file path:', envPath);
  process.exit(1);
}

// Import database connection
const connectDB = require('./config/db');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const pmRoutes = require('./routes/pmRoutes');
const salesRoutes = require('./routes/salesRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const clientRoutes = require('./routes/clientRoutes');

// Import new PM module routes
const projectRoutes = require('./routes/projectRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const taskRoutes = require('./routes/taskRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Import role-specific routes
const adminProjectRoutes = require('./routes/adminProjectRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');
const adminSalesRoutes = require('./routes/adminSalesRoutes');
const adminFinanceRoutes = require('./routes/adminFinanceRoutes');
const adminProjectExpenseRoutes = require('./routes/adminProjectExpenseRoutes');
const adminRewardRoutes = require('./routes/adminRewardRoutes');
const adminNoticeRoutes = require('./routes/adminNoticeRoutes');
const employeeProjectRoutes = require('./routes/employeeProjectRoutes');
const employeeTaskRoutes = require('./routes/employeeTaskRoutes');
const employeeAnalyticsRoutes = require('./routes/employeeAnalyticsRoutes');
const employeeMilestoneRoutes = require('./routes/employeeMilestoneRoutes');
const employeeNotificationRoutes = require('./routes/employeeNotificationRoutes');
const clientProjectRoutes = require('./routes/clientProjectRoutes');
const clientMilestoneRoutes = require('./routes/clientMilestoneRoutes');
const clientPaymentRoutes = require('./routes/clientPaymentRoutes');
const clientWalletRoutes = require('./routes/clientWalletRoutes');
const clientNotificationRoutes = require('./routes/clientNotificationRoutes');
const clientExploreRoutes = require('./routes/clientExploreRoutes');
const requestRoutes = require('./routes/requestRoutes');

// Master Admin routes
const masterAdminRoutes = require('./routes/masterAdminRoutes');
const masterAdminCompanyRoutes = require('./routes/masterAdminCompanyRoutes');
const masterAdminSubscriptionRoutes = require('./routes/masterAdminSubscriptionRoutes');
const masterAdminPlanRoutes = require('./routes/masterAdminPlanRoutes');
const masterAdminUserRoutes = require('./routes/masterAdminUserRoutes');
const masterAdminAnalyticsRoutes = require('./routes/masterAdminAnalyticsRoutes');
const masterAdminBillingRoutes = require('./routes/masterAdminBillingRoutes');
const masterAdminLogRoutes = require('./routes/masterAdminLogRoutes');

// Import socket service
const socketService = require('./services/socketService');

// Import daily points scheduler
const { startDailyScheduler } = require('./services/dailyPointsScheduler');
// Import recurring expense auto-pay scheduler
const { startRecurringExpenseAutoPayScheduler } = require('./services/recurringExpenseAutoPayScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Define allowed origins
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  'http://localhost:5174', // Vite alternative port
  'http://localhost:5175', // Vite alternative port
  'http://localhost:5176', // Vite alternative port
  'http://localhost:5177', // Vite alternative port
  'http://localhost:5178', // Vite alternative port
  'http://localhost:5179', // Vite alternative port
  'http://localhost:5180', // Vite alternative port
  'http://localhost:5181', // Vite alternative port
  'http://localhost:3000',  // React default port
  'https://supercrm.appzeto.com',  // Production frontend
  'https://www.supercrm.appzeto.com',  // Production frontend with www
  'https://api.supercrm.appzeto.com',
  ' https://crm-saa-s.vercel.app',  // API domain (for cross-origin requests)
  ' https://crm-saa-s.vercel.app/master-admin'  // API domain (for cross-origin requests)
];

// ROOT CAUSE FIX: Custom CORS middleware that runs BEFORE everything else
// This ensures CORS headers are ALWAYS set, even if the cors package fails under PM2
// MUST be the ABSOLUTE FIRST middleware - nothing can run before this
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Always log ALL requests for debugging (especially OPTIONS)
  console.log(`📥 ${req.method} ${req.path} | Origin: ${origin || 'none'}`);
  
  // Handle OPTIONS preflight requests FIRST - respond immediately
  if (req.method === 'OPTIONS') {
    console.log('🔍 OPTIONS preflight detected');
    console.log('   Path:', req.path);
    console.log('   Origin:', origin || 'none');
    console.log('   Access-Control-Request-Method:', req.headers['access-control-request-method']);
    console.log('   Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
    
    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.header('Access-Control-Max-Age', '86400');
      console.log('✅ OPTIONS response sent with CORS headers');
      return res.sendStatus(204);
    } else if (!origin) {
      // No origin (same-origin request) - allow it
      console.log('✅ OPTIONS allowed (no origin - same origin)');
      return res.sendStatus(204);
    } else {
      // Origin not in allowed list
      console.log('❌ OPTIONS blocked - origin not allowed:', origin);
      console.log('   Allowed origins:', allowedOrigins);
      res.sendStatus(403);
      return;
    }
  }
  
  // For non-OPTIONS requests, set CORS headers if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  }
  
  next();
});

// Also use cors package as additional layer (but custom middleware above handles OPTIONS first)
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Log CORS configuration on startup
console.log('🔒 CORS Configuration:');
console.log('   Allowed origins:', allowedOrigins.length, 'origins configured');
console.log('   CORS_ORIGIN from .env:', process.env.CORS_ORIGIN || 'not set (using defaults)');
if (process.env.NODE_ENV === 'development') {
  console.log('   Allowed origins list:', allowedOrigins);
}

// Configure Helmet AFTER CORS - Helmet must not interfere with CORS headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  contentSecurityPolicy: false // Disable CSP to avoid conflicts with CORS
}));

// Other middleware
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Note: OPTIONS are handled by custom CORS middleware above, so no need for explicit handler here

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Appzeto Backend API',
    status: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Server status route with WebSocket info
app.get('/status', (req, res) => {
  const connectedUsers = socketService.getConnectedUsersCount();
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    server: {
      status: 'RUNNING',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      }
    },
    websocket: {
      status: socketService.io ? 'ACTIVE' : 'INACTIVE',
      connectedUsers: connectedUsers,
      activeRooms: socketService.io?.sockets.adapter.rooms.size || 0
    },
    database: {
      status: 'CONNECTED',
      host: process.env.MONGODB_URI ? 'Connected' : 'Not configured'
    },
    timestamp: new Date().toISOString()
  });
});

// API routes with /api prefix
// Note: More specific routes should come before less specific ones
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pm', pmRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/client', clientRoutes);

// API routes without /api prefix (for reverse proxy compatibility)
// This allows frontend to call /admin/login instead of /api/admin/login
// Note: More specific routes must come before less specific ones
app.use('/admin/users', adminUserRoutes);
app.use('/admin', adminRoutes);
app.use('/pm', pmRoutes);
app.use('/sales', salesRoutes);
app.use('/employee', employeeRoutes);
app.use('/client', clientRoutes);

// Universal API routes with /api prefix (available to all authenticated users)
app.use('/api/requests', requestRoutes);

// PM Module API routes (PM-only) with /api prefix
app.use('/api/projects', projectRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Universal API routes without /api prefix (for reverse proxy compatibility)
app.use('/requests', requestRoutes);

// PM Module API routes without /api prefix (for reverse proxy compatibility)
app.use('/projects', projectRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/tasks', taskRoutes);
app.use('/payments', paymentRoutes);
app.use('/analytics', analyticsRoutes);

// Role-specific API routes with /api prefix
// Admin routes
app.use('/api/admin/projects', adminProjectRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/sales', adminSalesRoutes);
app.use('/api/admin/finance', adminFinanceRoutes);
app.use('/api/admin/project-expenses', adminProjectExpenseRoutes);
app.use('/api/admin/rewards', adminRewardRoutes);
app.use('/api/admin/notices', adminNoticeRoutes);

// Employee routes
app.use('/api/employee/projects', employeeProjectRoutes);
app.use('/api/employee/tasks', employeeTaskRoutes);
app.use('/api/employee/analytics', employeeAnalyticsRoutes);
app.use('/api/employee/milestones', employeeMilestoneRoutes);
app.use('/api/employee/notifications', employeeNotificationRoutes);

// Client routes
app.use('/api/client/projects', clientProjectRoutes);
app.use('/api/client/milestones', clientMilestoneRoutes);
app.use('/api/client/payments', clientPaymentRoutes);
app.use('/api/client/wallet', clientWalletRoutes);
app.use('/api/client/notifications', clientNotificationRoutes);
app.use('/api/client/explore', clientExploreRoutes);

// Master Admin routes with /api prefix
app.use('/api/master-admin', masterAdminRoutes);
app.use('/api/master-admin/companies', masterAdminCompanyRoutes);
app.use('/api/master-admin/subscriptions', masterAdminSubscriptionRoutes);
app.use('/api/master-admin/plans', masterAdminPlanRoutes);
app.use('/api/master-admin/users', masterAdminUserRoutes);
app.use('/api/master-admin/analytics', masterAdminAnalyticsRoutes);
app.use('/api/master-admin/billing', masterAdminBillingRoutes);
app.use('/api/master-admin/logs', masterAdminLogRoutes);

// Role-specific API routes without /api prefix (for reverse proxy compatibility)
// Admin routes
app.use('/admin/projects', adminProjectRoutes);
app.use('/admin/analytics', adminAnalyticsRoutes);
app.use('/admin/sales', adminSalesRoutes);
app.use('/admin/finance', adminFinanceRoutes);
app.use('/admin/project-expenses', adminProjectExpenseRoutes);
app.use('/admin/rewards', adminRewardRoutes);
app.use('/admin/notices', adminNoticeRoutes);

// Employee routes
app.use('/employee/projects', employeeProjectRoutes);
app.use('/employee/tasks', employeeTaskRoutes);
app.use('/employee/analytics', employeeAnalyticsRoutes);
app.use('/employee/milestones', employeeMilestoneRoutes);
app.use('/employee/notifications', employeeNotificationRoutes);

// Client routes
app.use('/client/projects', clientProjectRoutes);
app.use('/client/milestones', clientMilestoneRoutes);
app.use('/client/payments', clientPaymentRoutes);
app.use('/client/wallet', clientWalletRoutes);
app.use('/client/notifications', clientNotificationRoutes);
app.use('/client/explore', clientExploreRoutes);

// Master Admin routes without /api prefix (for reverse proxy compatibility)
app.use('/master-admin', masterAdminRoutes);
app.use('/master-admin/companies', masterAdminCompanyRoutes);
app.use('/master-admin/subscriptions', masterAdminSubscriptionRoutes);
app.use('/master-admin/plans', masterAdminPlanRoutes);
app.use('/master-admin/users', masterAdminUserRoutes);
app.use('/master-admin/analytics', masterAdminAnalyticsRoutes);
app.use('/master-admin/billing', masterAdminBillingRoutes);
app.use('/master-admin/logs', masterAdminLogRoutes);

// API routes documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'Appzeto Backend API Documentation',
    version: '1.0.0',
    availableRoutes: {
      authentication: [
        'POST /api/admin/login',
        'GET /api/admin/profile',
        'POST /api/admin/logout',
        'POST /api/pm/login',
        'GET /api/pm/profile',
        'POST /api/pm/logout',
        'POST /api/sales/login',
        'GET /api/sales/profile',
        'POST /api/sales/logout',
        'POST /api/employee/login',
        'GET /api/employee/profile',
        'POST /api/employee/logout',
        'POST /api/client/send-otp',
        'POST /api/client/verify-otp',
        'GET /api/client/profile',
        'POST /api/client/logout'
      ],
      admin: [
        'GET /api/admin/users/statistics',
        'GET /api/admin/users',
        'GET /api/admin/users/:userType/:id',
        'POST /api/admin/users',
        'PUT /api/admin/users/:userType/:id',
        'DELETE /api/admin/users/:userType/:id',
        'GET /api/admin/projects',
        'GET /api/admin/projects/:id',
        'POST /api/admin/projects',
        'PUT /api/admin/projects/:id',
        'DELETE /api/admin/projects/:id',
        'GET /api/admin/projects/statistics',
        'GET /api/admin/analytics/dashboard',
        'GET /api/admin/analytics/system',
        'POST /api/admin/sales/leads',
        'POST /api/admin/sales/leads/bulk',
        'GET /api/admin/sales/leads',
        'GET /api/admin/sales/leads/:id',
        'PUT /api/admin/sales/leads/:id',
        'DELETE /api/admin/sales/leads/:id',
        'GET /api/admin/sales/leads/statistics',
        'POST /api/admin/sales/categories',
        'GET /api/admin/sales/categories',
        'GET /api/admin/sales/categories/:id',
        'PUT /api/admin/sales/categories/:id',
        'DELETE /api/admin/sales/categories/:id',
        'GET /api/admin/sales/categories/performance',
        'GET /api/admin/sales/team',
        'GET /api/admin/sales/team/:id',
        'PUT /api/admin/sales/team/:id/target',
        'POST /api/admin/sales/team/:id/distribute-leads',
        'GET /api/admin/sales/team/:id/leads',
        'GET /api/admin/sales/team/:id/leads/category/:categoryId',
        'POST /api/admin/sales/team/:id/incentive',
        'GET /api/admin/sales/team/:id/incentives',
        'PUT /api/admin/sales/team/:id/incentive/:incentiveId',
        'GET /api/admin/sales/overview',
        'GET /api/admin/sales/analytics/categories',
        'GET /api/admin/sales/analytics/team'
      ],
      projects: [
        'POST /api/projects (PM only)',
        'GET /api/projects (PM only)',
        'GET /api/projects/:id (PM only)',
        'PUT /api/projects/:id (PM only)',
        'DELETE /api/projects/:id (PM only)',
        'GET /api/projects/client/:clientId (PM only)',
        'GET /api/projects/pm/:pmId (PM only)',
        'GET /api/projects/statistics (PM only)',
        'POST /api/projects/:id/attachments (PM only)',
        'DELETE /api/projects/:id/attachments/:attachmentId (PM only)'
      ],
      milestones: [
        'POST /api/milestones',
        'GET /api/milestones/project/:projectId',
        'GET /api/milestones/:id',
        'PUT /api/milestones/:id',
        'DELETE /api/milestones/:id',
        'PATCH /api/milestones/:id/progress',
        'POST /api/milestones/:id/attachments',
        'DELETE /api/milestones/:id/attachments/:attachmentId'
      ],
      tasks: [
        'POST /api/tasks',
        'POST /api/tasks/urgent',
        'GET /api/tasks/milestone/:milestoneId',
        'GET /api/tasks/project/:projectId',
        'GET /api/tasks/employee/:employeeId',
        'GET /api/tasks/urgent',
        'GET /api/tasks/:id',
        'PUT /api/tasks/:id',
        'DELETE /api/tasks/:id',
        'PATCH /api/tasks/:id/status',
        'PATCH /api/tasks/:id/assign',
        'POST /api/tasks/:id/comments',
        'POST /api/tasks/:id/attachments',
        'DELETE /api/tasks/:id/attachments/:attachmentId'
      ],
      payments: [
        'POST /api/payments',
        'GET /api/payments/project/:projectId',
        'GET /api/payments/client/:clientId',
        'PUT /api/payments/:id',
        'GET /api/payments/statistics',
        'GET /api/payments/project/:projectId/statistics',
        'GET /api/payments/client/:clientId/statistics'
      ],
      analytics: [
        'GET /api/analytics/pm/dashboard',
        'GET /api/analytics/project/:projectId',
        'GET /api/analytics/employee/:employeeId',
        'GET /api/analytics/client/:clientId',
        'GET /api/analytics/productivity'
      ],
      employee: [
        'GET /api/employee/projects (Employee only)',
        'GET /api/employee/projects/:id (Employee only)',
        'GET /api/employee/projects/:id/milestones (Employee only)',
        'GET /api/employee/projects/statistics (Employee only)',
        'GET /api/employee/tasks (Employee only)',
        'GET /api/employee/tasks/:id (Employee only)',
        'PATCH /api/employee/tasks/:id/status (Employee only)',
        'POST /api/employee/tasks/:id/comments (Employee only)',
        'GET /api/employee/tasks/urgent (Employee only)',
        'GET /api/employee/tasks/statistics (Employee only)'
      ],
      client: [
        'GET /api/client/projects (Client only)',
        'GET /api/client/projects/:id (Client only)',
        'GET /api/client/projects/:id/milestones (Client only)',
        'GET /api/client/projects/statistics (Client only)',
        'GET /api/client/payments (Client only)',
        'GET /api/client/payments/:id (Client only)',
        'GET /api/client/payments/statistics (Client only)'
      ]
    },
    websocket: {
      connection: 'Socket.io connection with JWT authentication',
      rooms: [
        'project_{projectId}',
        'milestone_{milestoneId}',
        'task_{taskId}',
        'user_{userId}'
      ],
      events: [
        'join_project',
        'leave_project',
        'join_milestone',
        'leave_milestone',
        'join_task',
        'leave_task',
        'project_updated',
        'milestone_updated',
        'task_updated',
        'task_status_changed',
        'comment_added'
      ]
    }
  });
});

// 404 handler - ensure CORS headers are set
app.use('*', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware - ensure CORS headers are set on errors
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  console.error('Error stack:', err.stack);
  
  // Set CORS headers on error responses
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Something went wrong!' : 'Request failed',
    message: process.env.NODE_ENV === 'development' ? message : (statusCode === 500 ? 'Internal server error' : message)
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    const server = app.listen(PORT, () => {
      // Clear console for clean startup
      console.clear();
      
      // Beautiful server startup display
      console.log('\n');
      console.log('🚀 ' + '='.repeat(60));
      console.log('   🎯 APPZETO BACKEND SERVER - PROJECT MANAGEMENT SYSTEM');
      console.log('🚀 ' + '='.repeat(60));
      console.log('');
      console.log('📊 SERVER STATUS:');
      console.log('   ✅ Server Status: RUNNING');
      console.log('   ✅ Database: CONNECTED');
      console.log('   ✅ WebSocket: INITIALIZING...');
      console.log('');
      console.log('🔧 CONFIGURATION:');
      console.log(`   🌐 Port: ${PORT}`);
      console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   🔗 API Base URL: http://localhost:${PORT}`);
      console.log(`   ❤️  Health Check: http://localhost:${PORT}/health`);
      console.log(`   📊 Server Status: http://localhost:${PORT}/status`);
      console.log('');
      console.log('📡 AVAILABLE MODULES:');
      console.log('   👤 Admin Management    🔐 Authentication');
      console.log('   📋 Project Management  🎯 Task Management');
      console.log('   📊 Analytics & Stats   💰 Payment Tracking');
      console.log('   👥 Team Management     📁 File Uploads');
      console.log('   🔄 Real-time Updates   📱 WebSocket Integration');
      console.log('');
      console.log('🚀 ' + '='.repeat(60));
      console.log('   🎉 Server started successfully! Ready for connections.');
      console.log('🚀 ' + '='.repeat(60));
      console.log('');
    });

    // Initialize Socket.io with enhanced logging
    socketService.initialize(server);

    // Start daily points scheduler
    startDailyScheduler();
    startRecurringExpenseAutoPayScheduler();

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      console.log('\n');
      console.log('🛑 ' + '='.repeat(50));
      console.log('   ⚠️  Received SIGINT (Ctrl+C)');
      console.log('   🔄 Shutting down gracefully...');
      console.log('🛑 ' + '='.repeat(50));
      server.close(() => {
        console.log('   ✅ Server closed successfully');
        console.log('   👋 Goodbye!');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n');
      console.log('🛑 ' + '='.repeat(50));
      console.log('   ⚠️  Received SIGTERM');
      console.log('   🔄 Shutting down gracefully...');
      console.log('🛑 ' + '='.repeat(50));
      server.close(() => {
        console.log('   ✅ Server closed successfully');
        console.log('   👋 Goodbye!');
        process.exit(0);
      });
    });

  } catch (error) {
    console.log('\n');
    console.log('❌ ' + '='.repeat(50));
    console.log('   🚨 FAILED TO START SERVER');
    console.log('❌ ' + '='.repeat(50));
    console.error('   Error:', error.message);
    console.log('   🔧 Please check your configuration and try again.');
    console.log('❌ ' + '='.repeat(50));
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
