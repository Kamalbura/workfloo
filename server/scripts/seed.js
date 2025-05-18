/**
 * Seed script for initial data setup
 * This creates the first admin user and organization
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Organization = require('../models/organization.model');

// Load environment variables from parent directory's .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Clear collections before seeding
const clearCollections = async () => {
  try {
    console.log('Removing existing seed data...');
    // Remove existing seed data instead of dropping entire collections
    if (mongoose.connection.collections['users']) {
      await User.deleteOne({ email: process.env.ADMIN_EMAIL || 'admin@workflow.com' });
    }
    if (mongoose.connection.collections['organizations']) {
      await Organization.deleteOne({ name: 'Work-Flow Organization' });
    }
    console.log('Existing seed data removed');
  } catch (err) {
    console.log('Error removing existing seed data:', err.message);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow')
  .then(() => {
    console.log('MongoDB connected for seeding...');
    return clearCollections();
  })
  .then(() => seedDatabase())
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
      // Create organization with a timestamp to make the name unique
    const timestamp = Date.now();
    const organization = new Organization({
      name: `Work-Flow Organization ${timestamp}`,
      description: 'Default organization created by seed script',
      contactEmail: process.env.ADMIN_EMAIL || 'admin@workflow.com',
      industry: 'Technology'
    });
    
    await organization.save();
    console.log('Default organization created:', organization.name);
      // Create admin user - let the schema handle password hashing
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    const admin = new User({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@workflow.com',
      password: password,
      passwordConfirm: password,  // This will match for validation and then be removed in pre-save hook
      role: 'admin',
      status: 'active',
      organization: organization._id,
      position: 'System Administrator'
    });
    
    await admin.save();
    console.log('Admin user created:', {
      email: admin.email,
      role: admin.role,
      organization: organization.name
    });
    
    console.log('Seeding completed successfully!');
    process.exit(0);  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

// Start seeding
seedDatabase();

// Start seeding
seedDatabase();