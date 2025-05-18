const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { promisify } = require('util');

/**
 * Authentication middleware to protect routes
 * Verifies the JWT token and attaches the user to the request
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {      return res.status(401).json({
        success: false,
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'User recently changed password! Please log in again.'
      });
    }

    // 5) Check if user is pending approval
    if (currentUser.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for an admin to approve your account.'
      });
    }

    // 6) Check if user is rejected
    if (currentUser.status === 'rejected') {
      return res.status(403).json({
        status: 'fail',
        message: 'Your account has been rejected. Please contact an administrator.'
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token or authentication failed'
    });
  }
};

/**
 * Authorization middleware to restrict routes to specific roles
 * @param  {...String} roles - The roles that are allowed to access the route
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

/**
 * Middleware to check if the user is an admin
 */
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message: 'This route is restricted to administrators'
    });
  }
  next();
};

/**
 * Middleware to check if the user is an employee
 */
exports.isEmployee = (req, res, next) => {
  if (req.user.role !== 'employee') {
    return res.status(403).json({
      status: 'fail',
      message: 'This route is restricted to employees'
    });
  }
  next();
};