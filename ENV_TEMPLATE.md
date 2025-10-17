# Environment Variables Template

Copy this content to create your `.env` file in the root directory.

```env
# Database
MONGODB_URI=mongodb://localhost:27017/werewolf_kill
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/werewolf_kill

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_this_in_production_min_32_chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Stripe Configuration
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# PayPal Configuration
# Get these from: https://developer.paypal.com/dashboard/applications
PAYPAL_CLIENT_ID=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_CLIENT_SECRET=ExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_MODE=sandbox
# For production, use: PAYPAL_MODE=live

# Cloudinary Configuration (Optional - for avatar uploads)
# Get these from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
# 900000 ms = 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
# Maximum 100 requests per window
```

## Quick Setup Instructions

### 1. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally and start the service
# The default connection string is: mongodb://localhost:27017/werewolf_kill
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address
5. Get your connection string and replace `MONGODB_URI`

### 2. JWT Secrets

Generate strong random secrets:
```bash
# Use this command to generate random secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice and use the outputs for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

### 3. Stripe Setup

1. Go to https://stripe.com
2. Create an account
3. Navigate to Developers → API keys
4. Copy the **Secret key** and **Publishable key**
5. For webhooks:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret

### 4. PayPal Setup

1. Go to https://developer.paypal.com
2. Log in with your PayPal account
3. Go to Apps & Credentials
4. Create a new app
5. Copy the **Client ID** and **Secret**
6. Use `sandbox` mode for testing, `live` for production

### 5. Cloudinary Setup (Optional)

1. Go to https://cloudinary.com
2. Create a free account
3. Go to Dashboard
4. Copy your **Cloud name**, **API Key**, and **API Secret**

## Testing Credentials

### Stripe Test Cards

Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

Any future expiry date and any 3-digit CVC.

### PayPal Sandbox

Create test accounts in the PayPal Developer Dashboard:
1. Go to Sandbox → Accounts
2. Create Personal and Business test accounts
3. Use these to test payments

## Production Checklist

Before deploying to production:

- [ ] Generate strong, unique JWT secrets
- [ ] Use production Stripe keys (`sk_live_...`, `pk_live_...`)
- [ ] Use production PayPal credentials with `PAYPAL_MODE=live`
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas or production database
- [ ] Set proper `CORS_ORIGIN` to your frontend domain
- [ ] Configure proper rate limits
- [ ] Set up Stripe webhooks for production domain
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Use environment variables in your hosting platform (don't commit `.env`)

