const ApiResponse = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = [err.errors[key].message];
    });
    
    return ApiResponse.error(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      errors
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return ApiResponse.error(
      res,
      `${field} already exists`,
      'DUPLICATE_ERROR',
      400
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(
      res,
      'Invalid token',
      'INVALID_TOKEN',
      401
    );
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(
      res,
      'Token expired',
      'TOKEN_EXPIRED',
      401
    );
  }

  // Default error
  return ApiResponse.error(
    res,
    err.message || 'Internal server error',
    err.code || 'INTERNAL_ERROR',
    err.statusCode || 500
  );
};

module.exports = errorHandler;

