const User = require('../models/user.model');
const Task = require('../models/task.model');

/**
 * Approve a pending employee and generate unique 6-digit employee ID
 * Admin only endpoint
 */
exports.approveEmployee = async (req, res, next) => {
  try {
    // Check if employee exists and is pending
    const employee = await User.findById(req.params.id);
    
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        status: 'fail',
        message: 'No employee found with that ID'
      });
    }
    
    if (employee.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: 'Employee is already approved or rejected'
      });
    }
    
    // Generate unique 6-digit employee ID
    let employeeId;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate a random 6-digit number
      employeeId = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if it's unique
      const existingEmployee = await User.findOne({ employeeId });
      if (!existingEmployee) {
        isUnique = true;
      }
    }
    
    // Update employee status and set employeeId
    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        employeeId: employeeId 
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        employee: updatedEmployee
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
 * Get all employees
 * Admin only endpoint
 */
exports.getAllEmployees = async (req, res, next) => {
  try {
    // Get employees from the same organization as the admin
    const employees = await User.find({
      role: 'employee',
      organization: req.user.organization
    });

    res.status(200).json({
      status: 'success',
      results: employees.length,
      data: {
        employees
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
 * Get employee by ID
 */
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        status: 'fail',
        message: 'No employee found with that ID'
      });
    }

    // Check if user has access to this employee
    // Admins can see any employee in their organization
    // Employees can only see their own profile
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to access this employee'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        employee
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
 * Update employee
 * Admin only endpoint
 */
exports.updateEmployee = async (req, res, next) => {
  try {
    // Check if employee exists
    const employee = await User.findById(req.params.id);
    
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        status: 'fail',
        message: 'No employee found with that ID'
      });
    }

    // Filter out unwanted fields
    const filteredBody = {};
    const allowedFields = ['name', 'email', 'position', 'photo', 'status'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });

    // Update employee
    const updatedEmployee = await User.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        employee: updatedEmployee
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
 * Delete employee
 * Admin only endpoint
 */
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);

    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        status: 'fail',
        message: 'No employee found with that ID'
      });
    }

    // Reassign or update tasks assigned to this employee
    await Task.updateMany(
      { assignedTo: req.params.id },
      { $unset: { assignedTo: 1 } }
    );

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Get employee performance metrics
 */
exports.getEmployeePerformance = async (req, res, next) => {
  try {
    // Check if employee exists
    const employee = await User.findById(req.params.id);
    
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        status: 'fail',
        message: 'No employee found with that ID'
      });
    }

    // Check if user has access to this employee data
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to access this data'
      });
    }

    // Get tasks assigned to employee
    const tasks = await Task.find({ assignedTo: req.params.id });

    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Tasks by priority
    const tasksByPriority = {
      low: tasks.filter(task => task.priority === 'low').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      high: tasks.filter(task => task.priority === 'high').length,
      urgent: tasks.filter(task => task.priority === 'urgent').length
    };

    // Tasks by status
    const tasksByStatus = {
      todo: tasks.filter(task => task.status === 'todo').length,
      inProgress: tasks.filter(task => task.status === 'inProgress').length,
      review: tasks.filter(task => task.status === 'review').length,
      done: tasks.filter(task => task.status === 'done').length
    };

    // Send response
    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          totalTasks,
          completedTasks,
          pendingTasks,
          completionRate,
          tasksByPriority,
          tasksByStatus
        }
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
 * Get employee tasks
 */
exports.getEmployeeTasks = async (req, res, next) => {
  try {
    // Check if employee exists
    const employee = await User.findById(req.params.id);
    
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        status: 'fail',
        message: 'No employee found with that ID'
      });
    }

    // Check if user has access to this employee data
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to access this data'
      });
    }

    // Get tasks assigned to employee
    let query = Task.find({ assignedTo: req.params.id });

    // Filter by status if provided
    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }

    // Sort by created date (newest first)
    query = query.sort('-createdAt');

    const tasks = await query;

    // Send response
    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: {
        tasks
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};