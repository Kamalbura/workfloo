const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get organization details - accessible to authenticated users
router.get('/', 
  authMiddleware.protect, 
  organizationController.getOrganization);

// Update organization details - admin only
router.put('/', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'), 
  organizationController.updateOrganization);

// Get organization statistics - admin only
router.get('/stats', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin'), 
  organizationController.getOrganizationStats);

// Create a new organization - protected in real world scenario
router.post('/',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  organizationController.createOrganization);

// Get available organizations for registration (public endpoint)
router.get('/available', organizationController.getAvailableOrganizations);

module.exports = router;