const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get all employees - admin only
router.get('/', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'), 
  employeeController.getAllEmployees);

// Get employee by ID
router.get('/:id', 
  authMiddleware.protect, 
  employeeController.getEmployeeById);

// Update employee - admin only
router.put('/:id', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'), 
  employeeController.updateEmployee);

// Delete employee - admin only
router.delete('/:id', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'), 
  employeeController.deleteEmployee);

// Get employee performance metrics
router.get('/:id/performance', 
  authMiddleware.protect, 
  employeeController.getEmployeePerformance);

// Get employee tasks
router.get('/:id/tasks', 
  authMiddleware.protect, 
  employeeController.getEmployeeTasks);

module.exports = router;