const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { promisify } = require('util');
const crypto = require('crypto');

// Helper function to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.JWT_EXPIRY) || 86400
  });
};

// Helper to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_EXPIRY) || 86400) * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  
  // Format user data properly to match client expectations
  const userData = {
    _id: user._id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    status: user.status
  };
  
  res.status(statusCode).json({
    success: true,
    token,
    user: userData
  });
};

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    console.log('Registration request received:', req.body);
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: req.body.email }, { username: req.body.username }]
    });
    
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({
        success: false,
        message: existingUser.email === req.body.email 
          ? 'Email is already registered' 
          : 'Username is already taken'
      });
    }
    
    // Set passwordConfirm to match password (since our form doesn't have it)
    req.body.passwordConfirm = req.body.password;
    
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.password,
      role: 'employee', // Default role is employee (admin is created via seed)
      organizationId: req.body.organizationId,
      mobile: req.body.mobile,
      status: 'pending' // Default status is pending (requires admin approval)
    });

    // Don't send token for registration, just success message
    res.status(201).json({
      success: true,
      message: 'Registration successful! Waiting for admin approval.',
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password!'
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }
    
    // Check password
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }
    
    // Check if user is active
    if (user.status === 'pending') {
      return res.status(401).json({
        success: false,
        message: 'Your account is pending approval from an administrator'
      });
    } else if (user.status === 'rejected') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been rejected. Please contact an administrator'
      });
    }

    console.log('Login successful for:', user.email);

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Logout user
 */
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User is already available in req due to the protect middleware
    const currentUser = await User.findById(req.user.id).populate({
      path: 'organizationId',
      select: 'name'
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status,
        organizationId: currentUser.organizationId?._id || currentUser.organizationId,
        organizationName: currentUser.organizationId?.name || '',
        mobile: currentUser.mobile || '',
        photo: currentUser.photo
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Fields allowed to be updated
    const allowedFields = ['firstName', 'lastName', 'mobile', 'photo'];
    
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        username: updatedUser.username,
        mobile: updatedUser.mobile || '',
        photo: updatedUser.photo
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Change user password
 */
exports.changePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your current password is wrong.'
      });
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Forgot password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email address.'
      });
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email (in a real app)
    // For now, just return the token
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
      resetToken
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // This is handled in the user model

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Get pending approvals (for admin)
 */
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' });
    res.status(200).json({
      status: 'success',
      results: pendingUsers.length,
      data: {
        users: pendingUsers
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
 * Approve user (for admin)
 */
exports.approveUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
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
 * Reject user (for admin)
 */
exports.rejectUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};