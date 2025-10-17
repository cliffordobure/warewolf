# 🚀 Quick Start Guide

Get your Werewolf Kill Game server running in 5 minutes!

## Prerequisites

- Node.js installed (v14+)
- MongoDB running (locally or Atlas)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment

Create a `.env` file in the root directory:

```env
# Minimum required configuration for local development
MONGODB_URI=mongodb://localhost:27017/werewolf_kill
JWT_SECRET=your_super_secret_key_min_32_characters_long_please
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_characters_long_please
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Optional: Add payment keys later
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
```

**Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice and use the outputs for your JWT secrets.

## Step 3: Start MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://mongodb.com/atlas
2. Create a free cluster
3. Get connection string
4. Replace `MONGODB_URI` in `.env`

## Step 4: Seed Shop Data

```bash
npm run seed
```

This creates initial shop items with coin packs.

## Step 5: Start the Server

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║   Werewolf Kill Game Server Started    ║
╠════════════════════════════════════════╣
║  Port: 3000                            ║
║  Environment: development              ║
║  Status: Running ✓                     ║
╚════════════════════════════════════════╝

MongoDB Connected: localhost:27017
```

## Step 6: Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Register a User:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

You should get back a success response with user data and access tokens!

## 🎮 Quick Test Flow

1. **Register 2+ users** (you need at least 5 for a real game, but you can test with 2)
2. **Login with first user** and save the access_token
3. **Create a game** using the token
4. **Login with second user** and save their access_token
5. **Join the game** with second user
6. **Start the game** (if you have 5+ players)

## 📝 Project Structure

```
server/
├── src/
│   ├── config/          # Database, Stripe, PayPal configs
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── socket/          # Socket.IO handlers
│   ├── utils/           # Helper functions
│   └── index.js         # Main server file
├── .env                 # Your environment variables
├── package.json
└── README.md
```

## 🔧 Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB if not running
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Kill the process using port 3000 or change PORT in `.env`
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### JWT Error
```
Error: secretOrPrivateKey must have a value
```
**Solution:** Make sure JWT_SECRET and JWT_REFRESH_SECRET are set in `.env`

## 🎯 Next Steps

### 1. Set Up Payment Integration

**Stripe:**
1. Create account at https://stripe.com
2. Get test API keys from dashboard
3. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**PayPal:**
1. Create developer account at https://developer.paypal.com
2. Create sandbox app
3. Add credentials to `.env`:
```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
```

### 2. Test Real-Time Features

Use a Socket.IO client to test real-time game features:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

socket.emit('join_game', {
  game_id: 'GAME_ID',
  user_id: 'USER_ID'
});
```

### 3. Connect Frontend

Update your frontend to use the API:
```javascript
const API_URL = 'http://localhost:3000/api/v1';

// Register
const response = await fetch(`${API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user',
    email: 'user@example.com',
    password: 'password'
  })
});
```

### 4. Deploy to Production

See `DEPLOYMENT.md` for detailed deployment instructions.

## 📚 Documentation

- `README.md` - Complete documentation
- `API_EXAMPLES.md` - API usage examples
- `DEPLOYMENT.md` - Deployment guide
- `ENV_TEMPLATE.md` - Environment variable guide

## 🆘 Need Help?

- Check the logs in console
- Review error messages carefully
- Ensure all environment variables are set
- Verify MongoDB is running
- Check that ports are not in use

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] `.env` file is configured
- [ ] Dependencies are installed (`npm install`)
- [ ] Shop is seeded (`npm run seed`)
- [ ] Server starts without errors
- [ ] Health check returns 200 OK
- [ ] Can register a user
- [ ] Can login
- [ ] Can create a game

## 🎉 Success!

If everything works, you should be able to:
- ✓ Register and login users
- ✓ Create and join games
- ✓ View shop items
- ✓ Process payments (with test keys)
- ✓ Real-time game updates via Socket.IO

**You're ready to build an amazing Werewolf game! 🐺🎮**

For more details, see the full documentation in `README.md` and `API_EXAMPLES.md`.

