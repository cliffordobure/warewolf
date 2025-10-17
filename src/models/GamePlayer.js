const mongoose = require('mongoose');

const gamePlayerSchema = new mongoose.Schema({
  game_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6, null],
    // 0: werewolf, 1: villager, 2: seer, 3: doctor, 4: hunter, 5: witch, 6: guard
    default: null
  },
  is_alive: {
    type: Boolean,
    default: true
  },
  is_host: {
    type: Boolean,
    default: false
  },
  votes: {
    type: Number,
    default: 0
  },
  has_voted: {
    type: Boolean,
    default: false
  },
  voted_for: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GamePlayer',
    default: null
  },
  night_action_target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GamePlayer',
    default: null
  },
  night_action_type: {
    type: String,
    enum: ['kill', 'check', 'protect', 'poison', 'antidote', 'guard', null],
    default: null
  },
  has_used_poison: {
    type: Boolean,
    default: false
  },
  has_used_antidote: {
    type: Boolean,
    default: false
  },
  joined_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes
gamePlayerSchema.index({ game_id: 1, user_id: 1 }, { unique: true });
gamePlayerSchema.index({ game_id: 1, is_alive: 1 });

module.exports = mongoose.model('GamePlayer', gamePlayerSchema);

