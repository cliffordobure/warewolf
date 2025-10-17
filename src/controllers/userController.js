const User = require('../models/User');
const ApiResponse = require('../utils/response');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return ApiResponse.error(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refresh_tokens;

    return ApiResponse.success(res, userResponse);
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, avatar_url } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return ApiResponse.error(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    // Update fields if provided
    if (username && username !== user.username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return ApiResponse.error(res, 'Username already exists', 'DUPLICATE_USERNAME', 400);
      }
      user.username = username;
    }

    if (avatar_url !== undefined) {
      user.avatar_url = avatar_url;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refresh_tokens;

    return ApiResponse.success(
      res,
      { user: userResponse },
      'Profile updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get user stats/leaderboard (bonus endpoint)
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('username avatar_url level experience games_played games_won')
      .sort({ experience: -1, games_won: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments();

    const usersWithWinRate = users.map(user => {
      const userObj = user.toObject();
      userObj.win_rate = user.games_played > 0 
        ? ((user.games_won / user.games_played) * 100).toFixed(1)
        : 0;
      return userObj;
    });

    return ApiResponse.paginated(
      res,
      usersWithWinRate,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1
      },
      'Leaderboard retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

