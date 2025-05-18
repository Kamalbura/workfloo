const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const taskController = require('../controllers/task.controller');
const employeeController = require('../controllers/employee.controller');

// Approve a task (admin only)
router.patch('/task/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), taskController.approveTask);

// Approve an employee (admin only)
router.put('/employee/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), employeeController.approveEmployee);

module.exports = router;
