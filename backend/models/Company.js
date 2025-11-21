const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    },
    zipCode: String
  },
  industry: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'trial', 'suspended'],
    default: 'trial'
  },
  plan: {
    type: String,
    enum: ['Starter', 'Professional', 'Premium'],
    default: 'Starter'
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  totalUsers: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
companySchema.index({ status: 1 });
companySchema.index({ plan: 1 });
companySchema.index({ email: 1 });
companySchema.index({ name: 1 });
companySchema.index({ joinedDate: -1 });

module.exports = mongoose.model('Company', companySchema);


