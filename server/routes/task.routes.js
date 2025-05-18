const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get all tasks - accessible to both admin and employees
router.get('/', authMiddleware.protect, taskController.getAllTasks);

// Get user's tasks - filtered for the authenticated user
router.get('/my-tasks', authMiddleware.protect, taskController.getUserTasks);

// Get overdue tasks - this route should come before ID routes
router.get('/overdue', authMiddleware.protect, taskController.getOverdueTasks);

// Get a single task by ID
router.get('/:id', authMiddleware.protect, taskController.getTaskById);

// Create a new task - only admins can create tasks
router.post('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), taskController.createTask);

// Update a task - anyone can update tasks they're assigned to
router.put('/:id', authMiddleware.protect, taskController.updateTask);

// Delete a task - only admins can delete tasks
router.delete('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), taskController.deleteTask);

// Change task status - useful for kanban board drag-and-drop
router.patch('/:id/status', authMiddleware.protect, taskController.updateTaskStatus);

// Assign task to an employee - admin only
router.patch('/:id/assign', authMiddleware.protect, authMiddleware.restrictTo('admin'), taskController.assignTask);

// Approve a task - admin only
router.patch('/:id/approve', authMiddleware.protect, authMiddleware.restrictTo('admin'), taskController.approveTask);

module.exports = router;