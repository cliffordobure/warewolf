const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  handleJoinGame,
  handleCastVote,
  handleNightAction,
  handleSendMessage
} = require('./gameHandlers');

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify user exists
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Update user online status
    User.findByIdAndUpdate(socket.userId, { 
      is_online: true,
      last_seen: new Date()
    }).catch(err => console.error('Error updating user status:', err));

    // Emit user online event
    io.emit('user_online', {
      user_id: socket.userId,
      username: socket.user.username,
      status: 'online'
    });

    // Game event handlers
    socket.on('join_game', handleJoinGame(io, socket));
    socket.on('cast_vote', handleCastVote(io, socket));
    socket.on('night_action', handleNightAction(io, socket));
    socket.on('send_message', handleSendMessage(io, socket));

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.userId);

      try {
        // Update user online status
        await User.findByIdAndUpdate(socket.userId, {
          is_online: false,
          last_seen: new Date()
        });

        // Emit user offline event
        io.emit('user_offline', {
          user_id: socket.userId,
          username: socket.user.username,
          status: 'offline'
        });
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  return io;
}

module.exports = initializeSocket;

