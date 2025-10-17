const GamePlayer = require('../models/GamePlayer');

// Role constants
const ROLES = {
  WEREWOLF: 0,
  VILLAGER: 1,
  SEER: 2,
  DOCTOR: 3,
  HUNTER: 4,
  WITCH: 5,
  GUARD: 6
};

const ROLE_NAMES = {
  0: 'Werewolf',
  1: 'Villager',
  2: 'Seer',
  3: 'Doctor',
  4: 'Hunter',
  5: 'Witch',
  6: 'Guard'
};

// Assign roles based on number of players
const assignRoles = (playerCount) => {
  const roles = [];
  
  if (playerCount >= 5) {
    // Minimum setup: 2 werewolves, 1 seer, 2 villagers
    roles.push(ROLES.WEREWOLF, ROLES.WEREWOLF);
    roles.push(ROLES.SEER);
    roles.push(ROLES.VILLAGER, ROLES.VILLAGER);
  }
  
  if (playerCount >= 6) {
    roles.push(ROLES.DOCTOR);
  }
  
  if (playerCount >= 7) {
    roles.push(ROLES.VILLAGER);
  }
  
  if (playerCount >= 8) {
    roles.push(ROLES.WITCH);
  }
  
  if (playerCount >= 9) {
    roles.push(ROLES.VILLAGER);
  }
  
  if (playerCount >= 10) {
    roles.push(ROLES.GUARD);
  }
  
  if (playerCount >= 11) {
    roles.push(ROLES.WEREWOLF);
  }
  
  if (playerCount >= 12) {
    roles.push(ROLES.HUNTER);
  }
  
  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  
  return roles;
};

// Check if game has ended
const checkGameEnd = async (gameId) => {
  const players = await GamePlayer.find({ game_id: gameId, is_alive: true });
  
  const werewolves = players.filter(p => p.role === ROLES.WEREWOLF);
  const others = players.filter(p => p.role !== ROLES.WEREWOLF);
  
  if (werewolves.length === 0) {
    return { ended: true, winner: 'villagers' };
  }
  
  if (werewolves.length >= others.length) {
    return { ended: true, winner: 'werewolves' };
  }
  
  return { ended: false, winner: null };
};

// Get role description
const getRoleDescription = (role) => {
  const descriptions = {
    [ROLES.WEREWOLF]: 'Kill a villager each night. Win by eliminating all villagers.',
    [ROLES.VILLAGER]: 'Discuss during the day and vote to eliminate suspects. Win by finding all werewolves.',
    [ROLES.SEER]: 'Check one player\'s role each night. Use this information to guide villagers.',
    [ROLES.DOCTOR]: 'Protect one player from being killed each night.',
    [ROLES.HUNTER]: 'When eliminated, take one player with you.',
    [ROLES.WITCH]: 'Use poison to kill or antidote to save once per game.',
    [ROLES.GUARD]: 'Guard one player each night from werewolf attacks.'
  };
  
  return descriptions[role] || 'Unknown role';
};

// Phase constants
const PHASES = {
  WAITING: 0,
  NIGHT: 1,
  DAY: 2,
  VOTING: 3,
  ENDED: 4
};

const PHASE_NAMES = {
  0: 'waiting',
  1: 'night',
  2: 'day',
  3: 'voting',
  4: 'ended'
};

module.exports = {
  ROLES,
  ROLE_NAMES,
  PHASES,
  PHASE_NAMES,
  assignRoles,
  checkGameEnd,
  getRoleDescription
};

