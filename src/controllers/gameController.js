const Game = require('../models/Game');
const GamePlayer = require('../models/GamePlayer');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const { assignRoles, checkGameEnd, PHASES } = require('../utils/gameLogic');

// Utility function to clean up orphaned GamePlayer records
const cleanupOrphanedPlayers = async (userId) => {
  try {
    const orphanedPlayers = await GamePlayer.find({ user_id: userId })
      .populate('game_id');
    
    const playersToDelete = orphanedPlayers.filter(player => 
      !player.game_id || player.game_id.phase === PHASES.ENDED
    );
    
    if (playersToDelete.length > 0) {
      await GamePlayer.deleteMany({
        _id: { $in: playersToDelete.map(p => p._id) }
      });
      console.log(`Cleaned up ${playersToDelete.length} orphaned player records for user ${userId}`);
    }
  } catch (error) {
    console.error('Error cleaning up orphaned players:', error);
  }
};

// Get list of games
exports.getGames = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (status === 'waiting') {
      filter.is_started = false;
      filter.phase = PHASES.WAITING;
    } else if (status === 'started') {
      filter.is_started = true;
      filter.phase = { $in: [PHASES.NIGHT, PHASES.DAY, PHASES.VOTING] };
    } else if (status === 'ended') {
      filter.phase = PHASES.ENDED;
    }

    const games = await Game.find(filter)
      .populate('host_id', 'username avatar_url')
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Game.countDocuments(filter);

    const gamesWithHost = games.map(game => ({
      id: game._id,
      name: game.name,
      host: {
        id: game.host_id._id,
        username: game.host_id.username,
        avatar_url: game.host_id.avatar_url
      },
      current_players: game.current_players,
      max_players: game.max_players,
      phase: game.phase,
      is_started: game.is_started,
      is_private: game.is_private,
      created_at: game.created_at
    }));

    return ApiResponse.paginated(
      res,
      gamesWithHost,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1
      },
      'Games retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Create a new game
exports.createGame = async (req, res, next) => {
  try {
    const { name, max_players = 8, is_private = false, password } = req.body;

    // Validate max_players
    if (max_players < 5 || max_players > 12) {
      return ApiResponse.error(
        res,
        'Max players must be between 5 and 12',
        'INVALID_MAX_PLAYERS',
        400
      );
    }

    // Clean up any orphaned player records first
    await cleanupOrphanedPlayers(req.userId);
    
    // Check if user is already in an active game
    const existingPlayer = await GamePlayer.findOne({ user_id: req.userId })
      .populate('game_id');
    
    if (existingPlayer && existingPlayer.game_id && existingPlayer.game_id.phase !== PHASES.ENDED) {
      return ApiResponse.error(
        res,
        'You are already in a game',
        'ALREADY_IN_GAME',
        400
      );
    }

    // Create game
    const game = new Game({
      name,
      host_id: req.userId,
      max_players,
      current_players: 1,
      is_private,
      password: is_private ? password : null
    });

    await game.save();

    // Add host as first player
    const gamePlayer = new GamePlayer({
      game_id: game._id,
      user_id: req.userId,
      is_host: true
    });

    await gamePlayer.save();

    // Populate player data
    await gamePlayer.populate('user_id', 'username avatar_url');

    const gameResponse = {
      id: game._id,
      name: game.name,
      host_id: game.host_id,
      max_players: game.max_players,
      current_players: game.current_players,
      phase: game.phase,
      is_started: game.is_started,
      is_private: game.is_private,
      password: null,
      created_at: game.created_at,
      players: [{
        id: gamePlayer._id,
        user_id: gamePlayer.user_id._id,
        username: gamePlayer.user_id.username,
        avatar_url: gamePlayer.user_id.avatar_url,
        role: gamePlayer.role,
        is_alive: gamePlayer.is_alive,
        is_host: gamePlayer.is_host,
        votes: gamePlayer.votes,
        has_voted: gamePlayer.has_voted
      }]
    };

    return ApiResponse.success(
      res,
      { game: gameResponse },
      'Game created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// Get game details
exports.getGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);
    
    if (!game) {
      return ApiResponse.error(res, 'Game not found', 'GAME_NOT_FOUND', 404);
    }

    // Get all players
    const players = await GamePlayer.find({ game_id: gameId })
      .populate('user_id', 'username avatar_url');

    const playersResponse = players.map(p => ({
      id: p._id,
      user_id: p.user_id._id,
      username: p.user_id.username,
      avatar_url: p.user_id.avatar_url,
      role: p.role,
      is_alive: p.is_alive,
      is_host: p.is_host,
      votes: p.votes,
      has_voted: p.has_voted
    }));

    const gameResponse = {
      id: game._id,
      name: game.name,
      host_id: game.host_id,
      max_players: game.max_players,
      current_players: game.current_players,
      phase: game.phase,
      current_round: game.current_round,
      is_started: game.is_started,
      is_private: game.is_private,
      winner_team: game.winner_team,
      created_at: game.created_at,
      players: playersResponse
    };

    return ApiResponse.success(res, { game: gameResponse });
  } catch (error) {
    next(error);
  }
};

// Join a game
exports.joinGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { password } = req.body;

    const game = await Game.findById(gameId);
    
    if (!game) {
      return ApiResponse.error(res, 'Game not found', 'GAME_NOT_FOUND', 404);
    }

    // Check if game has already started
    if (game.is_started) {
      return ApiResponse.error(res, 'Game has already started', 'GAME_STARTED', 400);
    }

    // Check if game is full
    if (game.current_players >= game.max_players) {
      return ApiResponse.error(res, 'Game is full', 'GAME_FULL', 400);
    }

    // Check password for private games
    if (game.is_private && game.password !== password) {
      return ApiResponse.error(res, 'Invalid password', 'INVALID_PASSWORD', 401);
    }

    // Check if user is already in this game
    const existingPlayer = await GamePlayer.findOne({
      game_id: gameId,
      user_id: req.userId
    });

    if (existingPlayer) {
      return ApiResponse.error(res, 'Already in this game', 'ALREADY_JOINED', 400);
    }

    // Clean up any orphaned player records first
    await cleanupOrphanedPlayers(req.userId);
    
    // Check if user is in another active game
    const otherGamePlayer = await GamePlayer.findOne({ user_id: req.userId })
      .populate('game_id');
    
    if (otherGamePlayer && otherGamePlayer.game_id && otherGamePlayer.game_id.phase !== PHASES.ENDED) {
      return ApiResponse.error(res, 'You are already in another game', 'ALREADY_IN_GAME', 400);
    }

    // Add player to game
    const gamePlayer = new GamePlayer({
      game_id: gameId,
      user_id: req.userId,
      is_host: false
    });

    await gamePlayer.save();

    // Update game player count
    game.current_players += 1;
    await game.save();

    // Get all players
    const players = await GamePlayer.find({ game_id: gameId })
      .populate('user_id', 'username avatar_url');

    const playersResponse = players.map(p => ({
      id: p._id,
      user_id: p.user_id._id,
      username: p.user_id.username,
      avatar_url: p.user_id.avatar_url,
      role: p.role,
      is_alive: p.is_alive,
      is_host: p.is_host,
      votes: p.votes,
      has_voted: p.has_voted
    }));

    const gameResponse = {
      id: game._id,
      name: game.name,
      current_players: game.current_players,
      max_players: game.max_players,
      players: playersResponse
    };

    return ApiResponse.success(
      res,
      { game: gameResponse },
      'Joined game successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Leave a game
exports.leaveGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);
    
    if (!game) {
      return ApiResponse.error(res, 'Game not found', 'GAME_NOT_FOUND', 404);
    }

    // Check if game has already started
    if (game.is_started) {
      return ApiResponse.error(
        res,
        'Cannot leave game after it has started',
        'GAME_STARTED',
        400
      );
    }

    // Find and remove player
    const gamePlayer = await GamePlayer.findOne({
      game_id: gameId,
      user_id: req.userId
    });

    if (!gamePlayer) {
      return ApiResponse.error(res, 'Not in this game', 'NOT_IN_GAME', 400);
    }

    // Delete the player record
    await GamePlayer.deleteOne({ _id: gamePlayer._id });

    // Update game player count
    game.current_players -= 1;

    // If host left, delete game or assign new host
    if (gamePlayer.is_host) {
      if (game.current_players === 0) {
        await game.deleteOne();
        return ApiResponse.success(res, null, 'Game deleted');
      } else {
        // Assign new host
        const newHost = await GamePlayer.findOne({ game_id: gameId });
        if (newHost) {
          newHost.is_host = true;
          await newHost.save();
          game.host_id = newHost.user_id;
        }
      }
    }

    await game.save();

    return ApiResponse.success(res, null, 'Left game successfully');
  } catch (error) {
    next(error);
  }
};

// Start a game
exports.startGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId);
    
    if (!game) {
      return ApiResponse.error(res, 'Game not found', 'GAME_NOT_FOUND', 404);
    }

    // Check if user is host
    if (game.host_id.toString() !== req.userId.toString()) {
      return ApiResponse.error(res, 'Only host can start the game', 'NOT_HOST', 403);
    }

    // Check if game already started
    if (game.is_started) {
      return ApiResponse.error(res, 'Game has already started', 'GAME_STARTED', 400);
    }

    // Check minimum players
    if (game.current_players < 5) {
      return ApiResponse.error(
        res,
        'Need at least 5 players to start',
        'INSUFFICIENT_PLAYERS',
        400
      );
    }

    // Assign roles to players
    const players = await GamePlayer.find({ game_id: gameId });
    const roles = assignRoles(players.length);

    for (let i = 0; i < players.length; i++) {
      players[i].role = roles[i];
      await players[i].save();
    }

    // Update game
    game.is_started = true;
    game.phase = PHASES.NIGHT;
    game.current_round = 1;
    await game.save();

    // Populate player data
    const populatedPlayers = await GamePlayer.find({ game_id: gameId })
      .populate('user_id', 'username avatar_url');

    const playersResponse = populatedPlayers.map(p => ({
      id: p._id,
      user_id: p.user_id._id,
      username: p.user_id.username,
      role: p.role,
      is_alive: p.is_alive,
      is_host: p.is_host
    }));

    const gameResponse = {
      id: game._id,
      phase: game.phase,
      current_round: game.current_round,
      is_started: game.is_started,
      players: playersResponse
    };

    return ApiResponse.success(
      res,
      { game: gameResponse },
      'Game started successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Clean up orphaned player records (utility endpoint)
exports.cleanupOrphanedPlayers = async (req, res, next) => {
  try {
    await cleanupOrphanedPlayers(req.userId);
    
    return ApiResponse.success(
      res,
      null,
      'Orphaned player records cleaned up successfully'
    );
  } catch (error) {
    next(error);
  }
};

