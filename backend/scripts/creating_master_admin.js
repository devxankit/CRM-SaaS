const mongoose = require('mongoose');
const path = require('path');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://ram312908_db_user:ankit@cluster0.91jk0jf.mongodb.net/SaaS-CRM';

// Import the MasterAdmin model
const MasterAdmin = require(path.join(__dirname, '../models/MasterAdmin'));

// Function to create master admin user
const createMasterAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Check if master admin already exists
    const existingMasterAdmin = await MasterAdmin.findOne({ email: 'masteradmin@gmail.com' });
    
    if (existingMasterAdmin) {
      console.log('⚠️  Master Admin user already exists with email: masteradmin@gmail.com');
      console.log('Master Admin details:', {
        id: existingMasterAdmin._id,
        name: existingMasterAdmin.name,
        email: existingMasterAdmin.email,
        role: existingMasterAdmin.role,
        isActive: existingMasterAdmin.isActive
      });
      await mongoose.disconnect();
      return;
    }

    // Create new master admin user
    const masterAdminData = {
      name: 'Master Admin',
      email: 'masteradmin@gmail.com',
      password: 'master123',
      phone: '+919876543210',
      role: 'master-admin',
      dateOfBirth: new Date('1990-01-01'),
      joiningDate: new Date(),
      isActive: true
    };

    const masterAdmin = await MasterAdmin.create(masterAdminData);
    
    console.log('\n✅ Master Admin user created successfully!');
    console.log('='.repeat(60));
    console.log('📧 Email:', masterAdmin.email);
    console.log('🔑 Password: master123');
    console.log('👤 Name:', masterAdmin.name);
    console.log('🔐 Role:', masterAdmin.role);
    console.log('🆔 ID:', masterAdmin._id);
    console.log('='.repeat(60));
    console.log('\n✅ You can now login with these credentials!');
    console.log('');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error creating master admin user:', error);
    if (error.code === 11000) {
      console.error('   Email already exists in database');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the function
createMasterAdminUser();

