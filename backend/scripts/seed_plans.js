const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Plan = require('../models/Plan');

const defaultPlans = [
  {
    name: 'Starter',
    statement: 'Perfect for small teams getting started with CRM.',
    includes: [
      'Sales CRM module',
      'Project Management module',
      'Client Portal access',
      'Basic analytics & reporting',
      'Email support',
      'Up to 5 team members'
    ],
    price: 1999,
    period: '/month',
    extras: 'Best for startups',
    popular: false,
    isActive: true,
    order: 0
  },
  {
    name: 'Professional',
    statement: 'For growing teams managing operations and finance.',
    includes: [
      'All Starter features',
      'Employee Performance Hub',
      'Finance & Compliance Suite',
      'Advanced analytics & insights',
      'Priority email support',
      'Up to 20 team members',
      'Custom workflows'
    ],
    price: 2999,
    period: '/month',
    extras: 'Most popular',
    popular: true,
    isActive: true,
    order: 1
  },
  {
    name: 'Premium',
    statement: 'For established businesses needing advanced features.',
    includes: [
      'All Professional features',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom integrations',
      '24/7 priority support',
      'Advanced security features',
      'Migration support',
      'Custom automation setup'
    ],
    price: 4999,
    period: '/month',
    extras: 'Best for enterprises',
    popular: false,
    isActive: true,
    order: 2
  }
];

const seedPlans = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ram312908_db_user:ankit@cluster0.91jk0jf.mongodb.net/SaaS-CRM';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');

    // Check if plans already exist
    const existingPlans = await Plan.find();
    if (existingPlans.length > 0) {
      console.log(`Found ${existingPlans.length} existing plan(s). Skipping seed.`);
      console.log('To reseed, please delete existing plans first.');
      process.exit(0);
    }

    // Insert default plans
    const createdPlans = await Plan.insertMany(defaultPlans);
    console.log(`✅ Successfully seeded ${createdPlans.length} plans:`);
    createdPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name} - ₹${plan.price}${plan.period}`);
    });

    console.log('\n✨ Plans seeding completed successfully!');
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedPlans();

