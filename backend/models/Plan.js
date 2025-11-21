const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Plan name cannot exceed 50 characters']
  },
  statement: {
    type: String,
    required: [true, 'Plan statement is required'],
    trim: true,
    maxlength: [200, 'Statement cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  period: {
    type: String,
    enum: ['/month', '/quarter', '/year'],
    default: '/month'
  },
  includes: [{
    type: String,
    trim: true
  }],
  extras: {
    type: String,
    trim: true,
    maxlength: [100, 'Extras cannot exceed 100 characters']
  },
  popular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
planSchema.index({ isActive: 1 });
planSchema.index({ order: 1 });

module.exports = mongoose.model('Plan', planSchema);

