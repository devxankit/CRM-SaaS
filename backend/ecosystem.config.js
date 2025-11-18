// PM2 Ecosystem Configuration
// This file configures PM2 to run the Appzeto Backend application
// 
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 restart Appzeto-Backend
//   pm2 stop Appzeto-Backend
//   pm2 delete Appzeto-Backend
//
// Note: Make sure your .env file exists in the backend directory
// The application will automatically load environment variables from .env file
// IMPORTANT: Do NOT set env vars here except NODE_ENV and PORT
// All other env vars should be loaded from .env file by server.js
// This ensures PM2 always picks up the latest .env changes

module.exports = {
  apps: [{
    name: 'Appzeto-Backend',
    script: './server.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    
    // Environment variables
    // Only set NODE_ENV and PORT here - all other vars loaded from .env by server.js
    // This prevents PM2 from caching old env values
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 5050  // Changed to 5050 to match Nginx proxy_pass configuration
      // All other environment variables (MONGODB_URI, JWT_SECRET, etc.)
      // are loaded directly from .env file by server.js
      // This ensures PM2 always uses the latest .env values after restart
    },
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    
    // Restart behavior
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Resource limits
    max_memory_restart: '1G',
    
    // Monitoring
    watch: false, // Set to true for development auto-reload
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Advanced
    ignore_watch: ['node_modules', 'logs', '.git']
  }]
};

