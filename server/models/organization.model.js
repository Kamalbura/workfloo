const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  organization_id_slug: {
    type: String,
    unique: true,
    default: () => 'org-' + Math.random().toString(36).substring(2, 10)
  },
  name: {
    type: String,
    required: [true, 'An organization must have a name'],
    trim: true,
    unique: true,
    minlength: [2, 'Organization name must be at least 2 characters long'],
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Organization description cannot exceed 500 characters']
  },
  industry: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: 'default-org.png'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  website: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please provide a valid URL'
    ]
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  contactPhone: {
    type: String,
    trim: true
  },
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

// Virtual populate for users in this organization
organizationSchema.virtual('users', {
  ref: 'User',
  foreignField: 'organization',
  localField: '_id'
});

// Virtual populate for tasks in this organization
organizationSchema.virtual('tasks', {
  ref: 'Task',
  foreignField: 'organization',
  localField: '_id'
});

// Pre-save middleware to update the updatedAt field
organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;