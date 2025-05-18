const Organization = require('../models/organization.model');
const User = require('../models/user.model');
const Task = require('../models/task.model');

/**
 * Get organization details
 */
exports.getOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.user.organization);
    
    if (!organization) {
      return res.status(404).json({
        status: 'fail',
        message: 'No organization found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        organization
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Update organization details
 * Admin only
 */
exports.updateOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.user.organization,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!organization) {
      return res.status(404).json({
        status: 'fail',
        message: 'No organization found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        organization
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Get organization statistics
 * Admin only
 */
exports.getOrganizationStats = async (req, res, next) => {
  try {
    const organizationId = req.user.organization;

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $match: { organization: organizationId }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get task statistics
    const taskStats = await Task.aggregate([
      {
        $match: { organization: organizationId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get task stats by priority
    const taskPriorityStats = await Task.aggregate([
      {
        $match: { organization: organizationId }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate completion rate
    const totalTasks = await Task.countDocuments({ organization: organizationId });
    const completedTasks = await Task.countDocuments({ 
      organization: organizationId, 
      status: 'done' 
    });
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Format the response data
    const formattedUserStats = {};
    userStats.forEach(stat => {
      formattedUserStats[stat._id] = stat.count;
    });

    const formattedTaskStats = {};
    taskStats.forEach(stat => {
      formattedTaskStats[stat._id] = stat.count;
    });

    const formattedPriorityStats = {};
    taskPriorityStats.forEach(stat => {
      formattedPriorityStats[stat._id] = stat.count;
    });

    // Send response
    res.status(200).json({
      status: 'success',
      data: {
        userStats: formattedUserStats,
        taskStats: formattedTaskStats,
        priorityStats: formattedPriorityStats,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        completionRate
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Create a new organization
 * This would typically be an admin or system action
 */
exports.createOrganization = async (req, res, next) => {
  try {
    const newOrganization = await Organization.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        organization: newOrganization
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Get available organizations for registration
 * This is a public endpoint for user registration
 */
exports.getAvailableOrganizations = async (req, res, next) => {
  try {
    const organizations = await Organization.find().select('name organization_id_slug');
    
    res.status(200).json({
      status: 'success',
      results: organizations.length,
      data: {
        organizations
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};
