const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Password management
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Get current user profile
router.get('/me', authMiddleware.protect, authController.getCurrentUser);
router.put('/update-profile', authMiddleware.protect, authController.updateProfile);
router.put('/change-password', authMiddleware.protect, authController.changePassword);

// Admin only routes
router.get('/pending-approvals', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'), 
  authController.getPendingApprovals);

router.put('/approve-user/:id', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'), 
  authController.approveUser);

router.put('/reject-user/:id', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'), 
  authController.rejectUser);

module.exports = router;