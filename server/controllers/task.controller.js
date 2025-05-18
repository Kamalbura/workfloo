const Task = require('../models/task.model');
const User = require('../models/user.model');

/**
 * Get all tasks
 * For admins: all tasks for the organization
 * For employees: only their assigned tasks
 */
exports.getAllTasks = async (req, res, next) => {
  try {
    let query;

    // If admin, show all tasks in the organization
    if (req.user.role === 'admin') {
      query = Task.find({ organization: req.user.organization });
    } else {
      // If employee, only show tasks assigned to them
      query = Task.find({ assignedTo: req.user._id });
    }

    // Allow filtering by status
    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }

    // Allow filtering by priority
    if (req.query.priority) {
      query = query.find({ priority: req.query.priority });
    }

    // Allow sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Execute query
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

/**
 * Get user's tasks 
 * For employees to see only their assigned tasks
 */
exports.getUserTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id }).sort('-createdAt');
    
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

/**
 * Get a task by ID
 */
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'No task found with that ID'
      });
    }

    // Check if user has permission to view this task (admin or assigned to)
    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to access this task'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        task
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
 * Create a new task
 * Only admins can create tasks
 */
exports.createTask = async (req, res, next) => {
  try {
    // Set the organization to the admin's organization
    req.body.organization = req.user.organization;
    req.body.createdBy = req.user._id;

    const newTask = await Task.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        task: newTask
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
 * Update a task
 * Admins can update any task
 * Employees can only update tasks assigned to them
 */
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'No task found with that ID'
      });
    }

    // Check if user has permission to update this task
    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to update this task'
      });
    }

    // Filter allowed fields based on user role
    const filteredBody = {};
    let allowedFields = ['title', 'description', 'priority', 'tags', 'comments'];
    
    // Admins can also change assignedTo, status, and dueDate
    if (req.user.role === 'admin') {
      allowedFields = [...allowedFields, 'assignedTo', 'status', 'dueDate'];
    }

    // Filter request body
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });

    // Set completedAt if status is changing to 'done'
    if (req.body.status === 'done' && task.status !== 'done') {
      filteredBody.completedAt = Date.now();
    } else if (req.body.status && req.body.status !== 'done') {
      filteredBody.completedAt = null; // Clear completedAt if status is not 'done'
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        task: updatedTask
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
 * Delete a task
 * Only admins can delete tasks
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'No task found with that ID'
      });
    }

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
 * Update task status
 * This is a dedicated endpoint for the Kanban board
 * Admins can update any task
 * Employees can only update tasks assigned to them
 */
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'No task found with that ID'
      });
    }

    // Check if user has permission to update this task
    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to update this task'
      });
    }    // Validate status
    const validStatuses = ['todo', 'inprogress', 'completed', 'approved', 'overdue'];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status value'
      });
    }

    // Update properties
    const updateData = { status: req.body.status };    // Set completedAt if status is changing to 'completed'
    if (req.body.status === 'completed' && task.status !== 'completed' && task.status !== 'approved') {
      updateData.completedAt = Date.now();
    } else if (req.body.status !== 'completed' && req.body.status !== 'approved') {
      updateData.completedAt = null; // Clear completedAt if task is not completed or approved
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        task: updatedTask
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
 * Approve a completed task
 * Only admins can approve tasks
 */
exports.approveTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'No task found with that ID'
      });
    }

    // Check if task is in completed status
    if (task.status !== 'completed') {
      return res.status(400).json({
        status: 'fail',
        message: 'Only completed tasks can be approved'
      });
    }

    // Update the task status to approved
    const approvedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        task: approvedTask
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
 * Get all overdue tasks
 * Overdue tasks are tasks where dueDate < currentDate and status is not completed/approved
 */
exports.getOverdueTasks = async (req, res, next) => {
  try {
    // Create query based on role
    let query;
      if (req.user.role === 'admin') {
      query = Task.find({ 
        organization: req.user.organization,
        dueDate: { $lt: new Date() },
        status: { $nin: ['completed', 'approved'] }
      });
    } else {
      query = Task.find({ 
        assignedTo: req.user._id,
        dueDate: { $lt: new Date() },
        status: { $nin: ['completed', 'approved'] }
      });
    }
    
    const tasks = await query;
    
    // Update status of these tasks to 'overdue' in the database
    if (tasks.length > 0) {
      const taskIds = tasks.map(task => task._id);
      await Task.updateMany(
        { _id: { $in: taskIds } },
        { status: 'overdue' }
      );
      
      // Refresh tasks with updated status
      const updatedTasks = await query;
      
      res.status(200).json({
        status: 'success',
        results: updatedTasks.length,
        data: {
          tasks: updatedTasks
        }
      });
    } else {
      res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          tasks: []
        }
      });
    }
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Assign task to an employee
 * Only admins can assign tasks
 */
exports.assignTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        status: 'fail',
        message: 'No task found with that ID'
      });
    }

    // Check if the assigned user exists and is an employee
    const employee = await User.findById(req.body.assignedTo);
    
    if (!employee || employee.role !== 'employee' || employee.status !== 'active') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid employee ID. Please select an active employee.'
      });
    }

    // Assign the task to the employee
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo: req.body.assignedTo },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};