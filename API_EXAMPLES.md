# API Usage Examples

This document provides practical examples of how to use the Werewolf Kill Game API.

## 🔐 Authentication Flow

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secret123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6501a3b2c1d2e3f4a5b6c7d8",
      "username": "john_doe",
      "email": "john@example.com",
      "coins": 1000,
      "level": 1,
      "experience": 0
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secret123"
  }'
```

### 3. Get Profile

```bash
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## 🎮 Game Flow

### 1. Create a Game

```bash
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Night Hunters",
    "max_players": 8,
    "is_private": false
  }'
```

### 2. List Available Games

```bash
curl -X GET "http://localhost:3000/api/v1/games?status=waiting&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Join a Game

```bash
curl -X POST http://localhost:3000/api/v1/games/GAME_ID/join \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Start Game (Host Only)

```bash
curl -X POST http://localhost:3000/api/v1/games/GAME_ID/start \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Get Game Details

```bash
curl -X GET http://localhost:3000/api/v1/games/GAME_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🛒 Shop & Payments

### 1. Get Shop Items

```bash
curl -X GET http://localhost:3000/api/v1/shop/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Stripe Payment Flow

**Step 1: Create Payment Intent**
```bash
curl -X POST http://localhost:3000/api/v1/payment/stripe/create-intent \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "SHOP_ITEM_ID",
    "amount": 4.99,
    "currency": "USD"
  }'
```

**Step 2: Confirm Payment (after client-side Stripe confirmation)**
```bash
curl -X POST http://localhost:3000/api/v1/payment/stripe/confirm \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_intent_id": "pi_1234567890"
  }'
```

### 3. PayPal Payment Flow

**Step 1: Create PayPal Order**
```bash
curl -X POST http://localhost:3000/api/v1/payment/paypal/create-order \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "SHOP_ITEM_ID",
    "amount": 4.99,
    "currency": "USD"
  }'
```

**Step 2: Capture Payment (after user approves on PayPal)**
```bash
curl -X POST http://localhost:3000/api/v1/payment/paypal/capture \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "PAYPAL_ORDER_ID"
  }'
```

### 4. Get Transaction History

```bash
curl -X GET "http://localhost:3000/api/v1/payment/transactions?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔌 Socket.IO Client Examples

### JavaScript Client

```javascript
import io from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Join a game
socket.emit('join_game', {
  game_id: 'GAME_ID',
  user_id: 'USER_ID'
});

socket.on('game_joined', (data) => {
  console.log('Joined game:', data);
});

// Listen for player joins
socket.on('player_joined', (data) => {
  console.log('Player joined:', data);
  // Update UI
});

// Listen for game start
socket.on('game_started', (data) => {
  console.log('Game started:', data);
  // Show role assignment
});

// Listen for phase changes
socket.on('phase_changed', (data) => {
  console.log('Phase changed:', data);
  // Update game UI
});

// Cast a vote
socket.emit('cast_vote', {
  game_id: 'GAME_ID',
  target_player_id: 'PLAYER_ID',
  voter_id: 'YOUR_PLAYER_ID'
});

socket.on('vote_cast', (data) => {
  console.log('Vote cast:', data);
  // Update vote counts
});

// Perform night action (e.g., werewolf kill)
socket.emit('night_action', {
  game_id: 'GAME_ID',
  player_id: 'YOUR_PLAYER_ID',
  action_type: 'kill', // or 'check', 'protect', 'poison', 'antidote', 'guard'
  target_player_id: 'TARGET_PLAYER_ID'
});

socket.on('night_action_result', (data) => {
  console.log('Night action result:', data);
  // Show result (for seer)
});

// Listen for eliminations
socket.on('player_eliminated', (data) => {
  console.log('Player eliminated:', data);
  // Show elimination animation
});

// Listen for game end
socket.on('game_ended', (data) => {
  console.log('Game ended:', data);
  // Show winner screen
});

// Send chat message
socket.emit('send_message', {
  game_id: 'GAME_ID',
  user_id: 'USER_ID',
  message: 'Hello everyone!',
  message_type: 'public'
});

socket.on('message_received', (data) => {
  console.log('Message:', data);
  // Display in chat
});

// Listen for user status
socket.on('user_online', (data) => {
  console.log('User online:', data);
});

socket.on('user_offline', (data) => {
  console.log('User offline:', data);
});

// Disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

## 🧪 Testing with JavaScript (Node.js)

### Complete Game Flow Test

```javascript
const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:3000';
let accessToken;
let gameId;

async function testGameFlow() {
  try {
    // 1. Register user
    const registerRes = await axios.post(`${API_URL}/api/v1/auth/register`, {
      username: `player_${Date.now()}`,
      email: `player_${Date.now()}@example.com`,
      password: 'password123'
    });
    
    accessToken = registerRes.data.data.tokens.access_token;
    console.log('✓ Registered user');

    // 2. Create game
    const gameRes = await axios.post(`${API_URL}/api/v1/games`, {
      name: 'Test Game',
      max_players: 8
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    gameId = gameRes.data.data.game.id;
    console.log('✓ Created game:', gameId);

    // 3. Connect with Socket.IO
    const socket = io(API_URL, {
      auth: { token: accessToken }
    });

    socket.on('connect', () => {
      console.log('✓ Connected to Socket.IO');
      
      // Join game room
      socket.emit('join_game', {
        game_id: gameId,
        user_id: registerRes.data.data.user._id
      });
    });

    socket.on('game_joined', (data) => {
      console.log('✓ Joined game room');
    });

    // 4. Get shop items
    const shopRes = await axios.get(`${API_URL}/api/v1/shop/items`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✓ Got shop items:', shopRes.data.data.items.length);

  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

testGameFlow();
```

## 📱 Frontend Integration Examples

### React + Socket.IO Hook

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useGameSocket(gameId, userId, token) {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_game', { game_id: gameId, user_id: userId });
    });

    newSocket.on('phase_changed', (data) => {
      setGameState(prev => ({ ...prev, phase: data.phase }));
    });

    newSocket.on('player_eliminated', (data) => {
      // Handle elimination
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [gameId, userId, token]);

  return { socket, gameState };
}
```

## 🎯 Common Use Cases

### Complete User Registration & Game Join

```javascript
async function registerAndJoinGame() {
  // 1. Register
  const { data: authData } = await axios.post('/api/v1/auth/register', {
    username: 'player1',
    email: 'player1@example.com',
    password: 'password123'
  });

  const token = authData.data.tokens.access_token;

  // 2. Get available games
  const { data: gamesData } = await axios.get('/api/v1/games?status=waiting', {
    headers: { Authorization: `Bearer ${token}` }
  });

  // 3. Join first available game
  const game = gamesData.data.items[0];
  await axios.post(`/api/v1/games/${game.id}/join`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // 4. Connect to Socket.IO
  const socket = io('http://localhost:3000', {
    auth: { token }
  });

  return { token, game, socket };
}
```

## 🔍 Error Handling

```javascript
try {
  const response = await axios.post('/api/v1/auth/login', {
    email: 'user@example.com',
    password: 'wrongpassword'
  });
} catch (error) {
  if (error.response) {
    // Server responded with error
    const { code, message, details } = error.response.data.error;
    console.error(`Error ${code}: ${message}`, details);
  } else {
    // Network error
    console.error('Network error:', error.message);
  }
}
```

## 📚 Additional Resources

- Full API documentation: See specification in project
- Postman collection: Import the provided collection file
- Test suite: Run `npm test` for automated tests

Happy coding! 🎮

