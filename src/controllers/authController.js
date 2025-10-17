const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ApiResponse = require('../utils/response');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return ApiResponse.error(res, 'Email already exists', 'DUPLICATE_EMAIL', 400);
      }
      if (existingUser.username === username) {
        return ApiResponse.error(res, 'Username already exists', 'DUPLICATE_USERNAME', 400);
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refresh_tokens.push({ token: refreshToken });
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refresh_tokens;

    return ApiResponse.success(
      res,
      {
        user: userResponse,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600
        }
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return ApiResponse.error(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return ApiResponse.error(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Update online status
    user.is_online = true;
    user.last_seen = new Date();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refresh_tokens.push({ token: refreshToken });
    
    // Keep only last 5 refresh tokens
    if (user.refresh_tokens.length > 5) {
      user.refresh_tokens = user.refresh_tokens.slice(-5);
    }
    
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refresh_tokens;

    return ApiResponse.success(
      res,
      {
        user: userResponse,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600
        }
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

// Refresh access token
exports.refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return ApiResponse.error(res, 'Refresh token required', 'TOKEN_REQUIRED', 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refresh_token);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return ApiResponse.error(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    const tokenExists = user.refresh_tokens.some(t => t.token === refresh_token);
    
    if (!tokenExists) {
      return ApiResponse.error(res, 'Invalid refresh token', 'INVALID_TOKEN', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    return ApiResponse.success(
      res,
      {
        access_token: accessToken,
        expires_in: 3600
      },
      'Token refreshed successfully'
    );
  } catch (error) {
    if (error.message.includes('token')) {
      return ApiResponse.error(res, error.message, 'INVALID_TOKEN', 401);
    }
    next(error);
  }
};

// Logout user
exports.logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    // Update user status
    const user = await User.findById(req.userId);
    user.is_online = false;
    user.last_seen = new Date();

    // Remove refresh token if provided
    if (refresh_token) {
      user.refresh_tokens = user.refresh_tokens.filter(t => t.token !== refresh_token);
    }

    await user.save();

    return ApiResponse.success(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

