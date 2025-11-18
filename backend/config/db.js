const mongoose = require('mongoose');
const path = require('path');

// Ensure dotenv is loaded
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
  try {
    // Validate MongoDB URI before attempting connection
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined. Please check your .env file or environment variables.');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // Beautiful database connection display
    console.log('');
    console.log('🗄️ ' + '='.repeat(50));
    console.log('   🎯 DATABASE CONNECTION ESTABLISHED');
    console.log('🗄️ ' + '='.repeat(50));
    console.log(`   🌐 Host: ${conn.connection.host}`);
    console.log(`   📊 Database: ${conn.connection.name}`);
    console.log(`   🔗 Connection State: ${conn.connection.readyState === 1 ? 'CONNECTED' : 'CONNECTING'}`);
    console.log(`   ⚡ Mongoose Version: ${mongoose.version}`);
    console.log('🗄️ ' + '='.repeat(50));
    console.log('');
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('   ✅ Database: CONNECTED');
    });

    mongoose.connection.on('error', (err) => {
      console.log('');
      console.log('❌ ' + '='.repeat(50));
      console.log('   🚨 DATABASE CONNECTION ERROR');
      console.log('❌ ' + '='.repeat(50));
      console.error('   Error:', err.message);
      console.log('❌ ' + '='.repeat(50));
      console.log('');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('');
      console.log('🔌 ' + '='.repeat(50));
      console.log('   ⚠️  DATABASE DISCONNECTED');
      console.log('🔌 ' + '='.repeat(50));
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.log('');
    console.log('❌ ' + '='.repeat(50));
    console.log('   🚨 DATABASE CONNECTION FAILED');
    console.log('❌ ' + '='.repeat(50));
    console.error('   Error:', error.message);
    console.log('   🔧 Please check your MongoDB connection string and try again.');
    console.log('❌ ' + '='.repeat(50));
    console.log('');
    process.exit(1);
  }
};

module.exports = connectDB;
