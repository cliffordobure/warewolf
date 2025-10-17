const mongoose = require('mongoose');

const gameActionSchema = new mongoose.Schema({
  game_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  player_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GamePlayer',
    required: true
  },
  action_type: {
    type: String,
    required: true,
    enum: ['vote', 'kill', 'check', 'protect', 'poison', 'antidote', 'guard', 'eliminate', 'chat']
  },
  target_player_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GamePlayer',
    default: null
  },
  round: {
    type: Number,
    required: true
  },
  phase: {
    type: String,
    required: true,
    enum: ['waiting', 'night', 'day', 'voting', 'ended']
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

// Indexes for game history queries
gameActionSchema.index({ game_id: 1, round: 1 });
gameActionSchema.index({ game_id: 1, created_at: -1 });

module.exports = mongoose.model('GameAction', gameActionSchema);

