const mongoose = require('mongoose');

const leadCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true, // unique: true creates an index automatically
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    match: [/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color code']
  },
  icon: {
    type: String,
    trim: true,
    maxlength: [10, 'Icon cannot exceed 10 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Created by admin is required']
  }
}, {
  timestamps: true
});

// Index for better performance
// Note: name index is created automatically by unique: true, so we don't need explicit index

// Virtual for lead count
leadCategorySchema.virtual('leadCount', {
  ref: 'Lead',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Virtual for active leads count
leadCategorySchema.virtual('activeLeadCount', {
  ref: 'Lead',
  localField: '_id',
  foreignField: 'category',
  count: true,
  match: { status: { $in: ['new', 'connected', 'hot'] } }
});

// Virtual for converted leads count
leadCategorySchema.virtual('convertedLeadCount', {
  ref: 'Lead',
  localField: '_id',
  foreignField: 'category',
  count: true,
  match: { status: 'converted' }
});

// Method to get category performance
leadCategorySchema.methods.getPerformance = async function() {
  const Lead = mongoose.model('Lead');
  
  const stats = await Lead.aggregate([
    { $match: { category: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    }
  ]);

  const totalLeads = stats.reduce((sum, stat) => sum + stat.count, 0);
  const convertedLeads = stats.find(stat => stat._id === 'converted')?.count || 0;
  const totalValue = stats.reduce((sum, stat) => sum + stat.totalValue, 0);
  const convertedValue = stats.find(stat => stat._id === 'converted')?.totalValue || 0;

  return {
    totalLeads,
    convertedLeads,
    conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
    totalValue,
    convertedValue,
    averageValue: totalLeads > 0 ? totalValue / totalLeads : 0
  };
};

// Static method to get all categories with performance
leadCategorySchema.statics.getAllWithPerformance = async function() {
  const categories = await this.find().populate('createdBy', 'name');
  
  const categoriesWithPerformance = await Promise.all(
    categories.map(async (category) => {
      const performance = await category.getPerformance();
      return {
        ...category.toObject(),
        performance
      };
    })
  );

  return categoriesWithPerformance;
};

// Static method to get category statistics
leadCategorySchema.statics.getCategoryStatistics = async function() {
  const Lead = mongoose.model('Lead');
  
  const stats = await Lead.aggregate([
    {
      $group: {
        _id: '$category',
        totalLeads: { $sum: 1 },
        convertedLeads: {
          $sum: {
            $cond: [{ $eq: ['$status', 'converted'] }, 1, 0]
          }
        },
        totalValue: { $sum: '$value' },
        convertedValue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'converted'] }, '$value', 0]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'leadcategories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $project: {
        categoryName: '$category.name',
        categoryColor: '$category.color',
        categoryIcon: '$category.icon',
        totalLeads: 1,
        convertedLeads: 1,
        conversionRate: {
          $multiply: [
            { $divide: ['$convertedLeads', '$totalLeads'] },
            100
          ]
        },
        totalValue: 1,
        convertedValue: 1,
        averageValue: {
          $divide: ['$totalValue', '$totalLeads']
        }
      }
    },
    {
      $sort: { totalLeads: -1 }
    }
  ]);

  return stats;
};

// Pre-delete middleware to check if category has leads
leadCategorySchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Lead = mongoose.model('Lead');
  const leadCount = await Lead.countDocuments({ category: this._id });
  
  if (leadCount > 0) {
    throw new Error(`Cannot delete category "${this.name}" because it has ${leadCount} associated leads. Please reassign or delete the leads first.`);
  }
});

// Remove sensitive data from JSON output
leadCategorySchema.methods.toJSON = function() {
  const category = this.toObject();
  return category;
};

module.exports = mongoose.model('LeadCategory', leadCategorySchema);
