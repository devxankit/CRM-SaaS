const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  plan: {
    type: String,
    enum: ['Starter', 'Professional', 'Premium'],
    required: [true, 'Plan is required']
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  users: {
    type: Number,
    required: [true, 'Number of users is required'],
    min: 1
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  nextBillingDate: {
    type: Date,
    required: [true, 'Next billing date is required']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterAdmin'
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
subscriptionSchema.index({ company: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ startDate: -1 });

// Virtual to check if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

module.exports = mongoose.model('Subscription', subscriptionSchema);


