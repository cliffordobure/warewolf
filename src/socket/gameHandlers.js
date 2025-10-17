const Game = require('../models/Game');
const GamePlayer = require('../models/GamePlayer');
const GameAction = require('../models/GameAction');
const User = require('../models/User');
const { checkGameEnd, PHASES, PHASE_NAMES, ROLES, ROLE_NAMES } = require('../utils/gameLogic');

// Handle player joining game room
exports.handleJoinGame = (io, socket) => async (data) => {
  try {
    const { game_id, user_id } = data;

    // Verify player is in the game
    const gamePlayer = await GamePlayer.findOne({ game_id, user_id });
    
    if (!gamePlayer) {
      socket.emit('error', { message: 'Not in this game' });
      return;
    }

    // Join game room
    socket.join(`game_${game_id}`);
    socket.gameId = game_id;
    socket.userId = user_id;

    // Confirm join
    socket.emit('game_joined', {
      success: true,
      game_id,
      message: 'Joined game successfully'
    });

    console.log(`User ${user_id} joined game ${game_id}`);
  } catch (error) {
    console.error('Error joining game:', error);
    socket.emit('error', { message: 'Failed to join game' });
  }
};

// Handle vote casting
exports.handleCastVote = (io, socket) => async (data) => {
  try {
    const { game_id, target_player_id, voter_id } = data;

    const game = await Game.findById(game_id);
    
    if (!game || game.phase !== PHASES.VOTING) {
      socket.emit('error', { message: 'Not in voting phase' });
      return;
    }

    // Get voter
    const voter = await GamePlayer.findOne({ game_id, user_id: voter_id });
    
    if (!voter || !voter.is_alive) {
      socket.emit('error', { message: 'Cannot vote' });
      return;
    }

    if (voter.has_voted) {
      socket.emit('error', { message: 'Already voted' });
      return;
    }

    // Get target
    const target = await GamePlayer.findById(target_player_id);
    
    if (!target || !target.is_alive) {
      socket.emit('error', { message: 'Invalid target' });
      return;
    }

    // Record vote
    voter.has_voted = true;
    voter.voted_for = target_player_id;
    await voter.save();

    target.votes += 1;
    await target.save();

    // Log action
    await GameAction.create({
      game_id,
      player_id: voter._id,
      action_type: 'vote',
      target_player_id: target._id,
      round: game.current_round,
      phase: PHASE_NAMES[game.phase]
    });

    // Get all votes
    const players = await GamePlayer.find({ game_id, is_alive: true });
    const voteCount = {};
    players.forEach(p => {
      voteCount[p._id.toString()] = p.votes;
    });

    // Broadcast vote
    io.to(`game_${game_id}`).emit('vote_cast', {
      game_id,
      voter_id,
      target_player_id,
      votes: voteCount
    });

    // Check if all players voted
    const allVoted = players.every(p => p.has_voted);
    
    if (allVoted) {
      // Find player with most votes
      let maxVotes = 0;
      let eliminated = null;
      
      players.forEach(p => {
        if (p.votes > maxVotes) {
          maxVotes = p.votes;
          eliminated = p;
        }
      });

      if (eliminated && maxVotes > 0) {
        // Eliminate player
        eliminated.is_alive = false;
        await eliminated.save();

        await eliminated.populate('user_id', 'username');

        io.to(`game_${game_id}`).emit('player_eliminated', {
          game_id,
          player_id: eliminated._id,
          username: eliminated.user_id.username,
          role: eliminated.role,
          role_name: ROLE_NAMES[eliminated.role],
          elimination_type: 'vote',
          votes_received: maxVotes,
          phase: game.phase,
          current_round: game.current_round
        });

        // Check game end
        const gameEnd = await checkGameEnd(game_id);
        
        if (gameEnd.ended) {
          await handleGameEnd(io, game_id, gameEnd.winner);
          return;
        }
      }

      // Move to next phase (night)
      await transitionToNight(io, game);
    }
  } catch (error) {
    console.error('Error casting vote:', error);
    socket.emit('error', { message: 'Failed to cast vote' });
  }
};

// Handle night actions
exports.handleNightAction = (io, socket) => async (data) => {
  try {
    const { game_id, player_id, action_type, target_player_id } = data;

    const game = await Game.findById(game_id);
    
    if (!game || game.phase !== PHASES.NIGHT) {
      socket.emit('error', { message: 'Not in night phase' });
      return;
    }

    // Get player
    const player = await GamePlayer.findById(player_id);
    
    if (!player || !player.is_alive) {
      socket.emit('error', { message: 'Cannot perform action' });
      return;
    }

    // Validate action based on role
    const validAction = validateNightAction(player.role, action_type);
    
    if (!validAction) {
      socket.emit('error', { message: 'Invalid action for your role' });
      return;
    }

    // Check if witch has already used this ability
    if (player.role === ROLES.WITCH) {
      if (action_type === 'poison' && player.has_used_poison) {
        socket.emit('error', { message: 'Poison already used' });
        return;
      }
      if (action_type === 'antidote' && player.has_used_antidote) {
        socket.emit('error', { message: 'Antidote already used' });
        return;
      }
    }

    // Record action
    player.night_action_target = target_player_id;
    player.night_action_type = action_type;
    await player.save();

    // Log action
    await GameAction.create({
      game_id,
      player_id: player._id,
      action_type,
      target_player_id,
      round: game.current_round,
      phase: PHASE_NAMES[game.phase]
    });

    // For Seer, return immediate result
    if (action_type === 'check') {
      const target = await GamePlayer.findById(target_player_id);
      
      socket.emit('night_action_result', {
        game_id,
        player_id,
        action_type: 'check',
        target_player_id,
        result: {
          role: target.role,
          role_name: ROLE_NAMES[target.role],
          is_werewolf: target.role === ROLES.WEREWOLF
        }
      });
    }

    // Check if all players with night actions have acted
    await checkNightPhaseComplete(io, game);
  } catch (error) {
    console.error('Error performing night action:', error);
    socket.emit('error', { message: 'Failed to perform action' });
  }
};

// Handle chat messages
exports.handleSendMessage = (io, socket) => async (data) => {
  try {
    const { game_id, user_id, message, message_type = 'public' } = data;

    // Get user
    const user = await User.findById(user_id);
    
    if (!user) {
      return;
    }

    // Broadcast message
    io.to(`game_${game_id}`).emit('message_received', {
      game_id,
      user_id,
      username: user.username,
      message,
      message_type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Helper functions
function validateNightAction(role, action_type) {
  const validActions = {
    [ROLES.WEREWOLF]: ['kill'],
    [ROLES.SEER]: ['check'],
    [ROLES.DOCTOR]: ['protect'],
    [ROLES.WITCH]: ['poison', 'antidote'],
    [ROLES.GUARD]: ['guard']
  };

  return validActions[role] && validActions[role].includes(action_type);
}

async function checkNightPhaseComplete(io, game) {
  // Get all alive players with night actions
  const players = await GamePlayer.find({
    game_id: game._id,
    is_alive: true,
    role: { $in: [ROLES.WEREWOLF, ROLES.SEER, ROLES.DOCTOR, ROLES.WITCH, ROLES.GUARD] }
  });

  const allActed = players.every(p => p.night_action_target !== null);

  if (allActed) {
    // Process night actions
    await processNightActions(io, game);
  }
}

async function processNightActions(io, game) {
  const gameId = game._id;
  
  // Get all night actions
  const players = await GamePlayer.find({ game_id: gameId, is_alive: true })
    .populate('night_action_target');

  // Find werewolf kill target
  const werewolfActions = players.filter(p => 
    p.role === ROLES.WEREWOLF && p.night_action_type === 'kill'
  );
  
  let killTarget = null;
  if (werewolfActions.length > 0) {
    // Use most common target
    const targetCounts = {};
    werewolfActions.forEach(w => {
      const targetId = w.night_action_target?._id?.toString();
      if (targetId) {
        targetCounts[targetId] = (targetCounts[targetId] || 0) + 1;
      }
    });
    
    const mostVoted = Object.keys(targetCounts).reduce((a, b) => 
      targetCounts[a] > targetCounts[b] ? a : b
    );
    
    killTarget = await GamePlayer.findById(mostVoted);
  }

  // Check for protection/guard
  const protections = players.filter(p => 
    (p.role === ROLES.DOCTOR || p.role === ROLES.GUARD) && 
    (p.night_action_type === 'protect' || p.night_action_type === 'guard')
  );

  let isProtected = false;
  if (killTarget && protections.length > 0) {
    isProtected = protections.some(p => 
      p.night_action_target?._id?.toString() === killTarget._id.toString()
    );
  }

  // Check for witch antidote
  const witchAntidote = players.find(p => 
    p.role === ROLES.WITCH && p.night_action_type === 'antidote'
  );

  if (witchAntidote && killTarget) {
    const antidoteTarget = witchAntidote.night_action_target;
    if (antidoteTarget?._id?.toString() === killTarget._id.toString()) {
      isProtected = true;
      witchAntidote.has_used_antidote = true;
      await witchAntidote.save();
    }
  }

  // Check for witch poison
  const witchPoison = players.find(p => 
    p.role === ROLES.WITCH && p.night_action_type === 'poison'
  );

  let poisonTarget = null;
  if (witchPoison && witchPoison.night_action_target) {
    poisonTarget = witchPoison.night_action_target;
    witchPoison.has_used_poison = true;
    await witchPoison.save();
  }

  // Apply eliminations
  const eliminated = [];

  if (killTarget && !isProtected) {
    killTarget.is_alive = false;
    await killTarget.save();
    await killTarget.populate('user_id', 'username');
    eliminated.push(killTarget);
  }

  if (poisonTarget) {
    poisonTarget.is_alive = false;
    await poisonTarget.save();
    await poisonTarget.populate('user_id', 'username');
    eliminated.push(poisonTarget);
  }

  // Broadcast eliminations
  for (const player of eliminated) {
    io.to(`game_${gameId}`).emit('player_eliminated', {
      game_id: gameId,
      player_id: player._id,
      username: player.user_id.username,
      role: player.role,
      role_name: ROLE_NAMES[player.role],
      elimination_type: 'night',
      phase: game.phase,
      current_round: game.current_round
    });
  }

  // Check game end
  const gameEnd = await checkGameEnd(gameId);
  
  if (gameEnd.ended) {
    await handleGameEnd(io, gameId, gameEnd.winner);
    return;
  }

  // Move to day phase
  await transitionToDay(io, game);
}

async function transitionToDay(io, game) {
  game.phase = PHASES.DAY;
  await game.save();

  // Reset night actions
  await GamePlayer.updateMany(
    { game_id: game._id },
    {
      $set: {
        night_action_target: null,
        night_action_type: null
      }
    }
  );

  io.to(`game_${game._id}`).emit('phase_changed', {
    game_id: game._id,
    phase: PHASES.DAY,
    phase_name: 'day',
    current_round: game.current_round,
    message: 'Day phase begins. Discuss and decide who to vote for.'
  });

  // Auto-transition to voting after 60 seconds (can be adjusted)
  setTimeout(() => {
    transitionToVoting(io, game);
  }, 60000);
}

async function transitionToVoting(io, game) {
  // Reload game to ensure we have latest data
  game = await Game.findById(game._id);
  
  if (game.phase !== PHASES.DAY) {
    return; // Phase already changed
  }

  game.phase = PHASES.VOTING;
  await game.save();

  // Reset votes
  await GamePlayer.updateMany(
    { game_id: game._id },
    {
      $set: {
        votes: 0,
        has_voted: false,
        voted_for: null
      }
    }
  );

  io.to(`game_${game._id}`).emit('phase_changed', {
    game_id: game._id,
    phase: PHASES.VOTING,
    phase_name: 'voting',
    current_round: game.current_round,
    message: 'Voting phase begins. Cast your vote to eliminate a player.'
  });
}

async function transitionToNight(io, game) {
  game.phase = PHASES.NIGHT;
  game.current_round += 1;
  await game.save();

  io.to(`game_${game._id}`).emit('phase_changed', {
    game_id: game._id,
    phase: PHASES.NIGHT,
    phase_name: 'night',
    current_round: game.current_round,
    message: 'Night falls. Special roles, perform your actions.'
  });
}

async function handleGameEnd(io, gameId, winner) {
  const game = await Game.findById(gameId);
  game.phase = PHASES.ENDED;
  game.winner_team = winner;
  await game.save();

  // Get all players
  const players = await GamePlayer.find({ game_id: gameId })
    .populate('user_id', 'username');

  // Update user stats for winners
  const winnerPlayers = players.filter(p => {
    if (winner === 'werewolves') {
      return p.role === ROLES.WEREWOLF;
    } else {
      return p.role !== ROLES.WEREWOLF;
    }
  });

  for (const player of players) {
    const user = await User.findById(player.user_id._id);
    user.games_played += 1;
    
    if (winnerPlayers.find(w => w.user_id._id.toString() === user._id.toString())) {
      user.games_won += 1;
    }
    
    // Add experience
    user.experience += 100;
    
    // Level up logic (every 1000 XP = 1 level)
    if (user.experience >= user.level * 1000) {
      user.level += 1;
    }
    
    await user.save();
  }

  const winnerPlayersResponse = winnerPlayers.map(p => ({
    id: p._id,
    username: p.user_id.username,
    role: p.role,
    role_name: ROLE_NAMES[p.role]
  }));

  io.to(`game_${gameId}`).emit('game_ended', {
    game_id: gameId,
    winner_team: winner,
    winner_players: winnerPlayersResponse,
    game_stats: {
      total_rounds: game.current_round,
      players_count: players.length
    }
  });
}

