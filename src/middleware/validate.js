const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach((error) => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });
    
    return ApiResponse.error(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      formattedErrors
    );
  }
  
  next();
};

module.exports = validate;

