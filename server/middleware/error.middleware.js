/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 */

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';

// Error handler for development environment
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Error handler for production environment
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Handle mongoose validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return {
    statusCode: 400,
    status: 'fail',
    message,
    isOperational: true
  };
};

// Handle mongoose duplicate fields errors
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return {
    statusCode: 400,
    status: 'fail',
    message,
    isOperational: true
  };
};

// Handle mongoose invalid ID errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return {
    statusCode: 400,
    status: 'fail',
    message,
    isOperational: true
  };
};

// Handle JWT invalid signature error
const handleJWTError = () => {
  return {
    statusCode: 401,
    status: 'fail',
    message: 'Invalid token. Please log in again!',
    isOperational: true
  };
};

// Handle JWT expired token error
const handleJWTExpiredError = () => {
  return {
    statusCode: 401,
    status: 'fail',
    message: 'Your token has expired! Please log in again.',
    isOperational: true
  };
};

// Main error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};