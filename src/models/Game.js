const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Game name is required'],
    trim: true,
    maxlength: [255, 'Game name must be less than 255 characters']
  },
  host_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  max_players: {
    type: Number,
    default: 8,
    min: 5,
    max: 12
  },
  current_players: {
    type: Number,
    default: 0
  },
  phase: {
    type: Number,
    default: 0,
    enum: [0, 1, 2, 3, 4], // 0: waiting, 1: night, 2: day, 3: voting, 4: ended
  },
  current_round: {
    type: Number,
    default: 0
  },
  is_started: {
    type: Boolean,
    default: false
  },
  is_private: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  winner_team: {
    type: String,
    enum: ['werewolves', 'villagers', null],
    default: null
  },
  phase_timer: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
gameSchema.index({ is_started: 1, created_at: -1 });
gameSchema.index({ host_id: 1 });

module.exports = mongoose.model('Game', gameSchema);

