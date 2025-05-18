const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A task must have a title'],
    trim: true,
    minlength: [3, 'Task title must be at least 3 characters long'],
    maxlength: [100, 'Task title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },  status: {
    type: String,
    enum: ['todo', 'inprogress', 'completed', 'approved', 'overdue'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A task must have a creator']
  },
  organization: {
    type: mongoose.Schema.ObjectId,
    ref: 'Organization',
    required: [true, 'A task must belong to an organization']
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: {
      type: String,
      required: [true, 'Comment text is required']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Comment must have a user']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient querying by organization and status
taskSchema.index({ organization: 1, status: 1 });

// Index for efficient querying of assigned tasks
taskSchema.index({ assignedTo: 1, status: 1 });

// Pre-save middleware to update the updatedAt field
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-find middleware to populate the assignedTo and createdBy fields
taskSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'assignedTo',
    select: 'name email photo'
  }).populate({
    path: 'createdBy',
    select: 'name email photo'
  });
  next();
});

// Virtual for calculating if the task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return !this.completedAt && new Date() > this.dueDate;
});

// Static method to get tasks statistics
taskSchema.statics.getTaskStats = async function(organizationId) {
  return await this.aggregate([
    {
      $match: { organization: mongoose.Types.ObjectId(organizationId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;