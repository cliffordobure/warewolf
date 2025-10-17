const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const ApiResponse = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(
        res,
        'Authentication required',
        'UNAUTHORIZED',
        401
      );
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return ApiResponse.error(
        res,
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    return ApiResponse.error(
      res,
      error.message || 'Invalid authentication token',
      'AUTHENTICATION_ERROR',
      401
    );
  }
};

module.exports = authenticate;

