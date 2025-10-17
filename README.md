# Werewolf Kill Game - Backend Server

A complete backend server for the Werewolf Kill game with real-time multiplayer features, authentication, and international payment integration.

## 🚀 Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Real-time Gameplay**: Socket.IO for real-time game state synchronization
- **Multiple Game Roles**: Werewolf, Villager, Seer, Doctor, Hunter, Witch, Guard
- **Payment Integration**: Stripe and PayPal support with multi-currency
- **In-game Shop**: Purchase coins with real money
- **User Progression**: Level and experience system
- **Game History**: Track all game actions and statistics

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Gateways**: Stripe, PayPal
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Stripe account (for payments)
- PayPal developer account (for payments)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/werewolf_kill
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/werewolf_kill

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_this_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Cloudinary (optional - for avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Seed the shop with initial items**
```bash
npm run seed
```

5. **Start the server**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files (database, stripe, paypal)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware (auth, validation, error handling)
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route definitions
│   ├── socket/          # Socket.IO handlers
│   ├── utils/           # Utility functions
│   ├── scripts/         # Utility scripts (seeding, etc.)
│   └── index.js         # Main application entry point
├── .env                 # Environment variables (create this)
├── .gitignore
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### User
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile
- `GET /api/v1/user/leaderboard` - Get leaderboard

### Games
- `GET /api/v1/games` - List all games
- `POST /api/v1/games` - Create new game
- `GET /api/v1/games/:gameId` - Get game details
- `POST /api/v1/games/:gameId/join` - Join a game
- `POST /api/v1/games/:gameId/leave` - Leave a game
- `POST /api/v1/games/:gameId/start` - Start a game (host only)

### Shop
- `GET /api/v1/shop/items` - Get all shop items
- `GET /api/v1/shop/items/:itemId` - Get single shop item

### Payment
- `POST /api/v1/payment/stripe/create-intent` - Create Stripe payment intent
- `POST /api/v1/payment/stripe/confirm` - Confirm Stripe payment
- `POST /api/v1/payment/paypal/create-order` - Create PayPal order
- `POST /api/v1/payment/paypal/capture` - Capture PayPal payment
- `GET /api/v1/payment/transactions` - Get transaction history

## 🎮 Socket.IO Events

### Client → Server
- `join_game` - Join a game room
- `cast_vote` - Cast vote during voting phase
- `night_action` - Perform night action (werewolf kill, seer check, etc.)
- `send_message` - Send chat message

### Server → Client
- `game_joined` - Confirmation of joining game
- `player_joined` - New player joined
- `player_left` - Player left game
- `game_started` - Game has started
- `phase_changed` - Game phase changed
- `vote_cast` - Vote was cast
- `night_action_result` - Result of night action
- `player_eliminated` - Player was eliminated
- `game_ended` - Game has ended
- `message_received` - Chat message received
- `user_online` - User came online
- `user_offline` - User went offline

## 🎭 Game Roles

- **Werewolf** (0): Kill a villager each night
- **Villager** (1): Vote to eliminate suspects during the day
- **Seer** (2): Check one player's role each night
- **Doctor** (3): Protect one player from being killed each night
- **Hunter** (4): When eliminated, take one player with you
- **Witch** (5): Use poison to kill or antidote to save (once per game)
- **Guard** (6): Guard one player each night from werewolf attacks

## 🎯 Game Phases

0. **Waiting** - Players joining the game
1. **Night** - Special roles perform their actions
2. **Day** - Players discuss and decide who to vote for
3. **Voting** - Players vote to eliminate someone
4. **Ended** - Game has concluded

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Helmet.js for security headers
- CORS configuration
- Input validation with express-validator

## 💳 Payment Integration

### Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the dashboard
3. Add keys to `.env` file
4. Test with test cards: `4242 4242 4242 4242`

### PayPal Setup
1. Create a PayPal developer account at https://developer.paypal.com
2. Create a sandbox app
3. Get your Client ID and Secret
4. Add credentials to `.env` file

## 🧪 Testing

Test the API using tools like:
- Postman
- Thunder Client (VS Code extension)
- cURL

Example health check:
```bash
curl http://localhost:3000/health
```

## 📊 Database Models

- **User**: User accounts with stats and progression
- **Game**: Game sessions and state
- **GamePlayer**: Players in specific games
- **ShopItem**: In-game shop items
- **Transaction**: Payment transactions
- **GameAction**: Game action history

## 🚀 Deployment

### Deploy to Render

1. Create account on https://render.com
2. Create new Web Service
3. Connect your repository
4. Set environment variables
5. Deploy!

### Environment for Production

Make sure to:
- Use strong JWT secrets
- Use production Stripe/PayPal keys
- Set `NODE_ENV=production`
- Use MongoDB Atlas for database
- Configure proper CORS_ORIGIN

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.

## 🎉 Acknowledgments

Built with ❤️ for the Werewolf game community!

