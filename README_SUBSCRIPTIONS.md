# 🐺 Werewolf Kill - Subscription System

> Complete monthly subscription system with Stripe and PayPal integration

## 🎯 Overview

This subscription system allows players to subscribe to monthly coin packages with automatic recurring billing. Players receive coins every month and enjoy exclusive benefits.

## ✨ Features

- 💳 **Multiple Payment Methods**: Stripe and PayPal support
- 🔄 **Recurring Billing**: Automatic monthly charges
- 🪙 **Automatic Coin Distribution**: Coins added instantly on payment
- 💰 **Multi-Currency**: USD, EUR, GBP, CNY support
- 📊 **Transaction History**: Complete payment records
- 🎁 **Flexible Plans**: Multiple subscription tiers with benefits
- 🔔 **Webhook Integration**: Real-time payment event handling
- 🔒 **Secure**: Industry-standard payment security

---

## 🚀 Quick Start

### 1️⃣ Install Dependencies (Already Done)

```bash
npm install
```

### 2️⃣ Configure Environment

Create a `.env` file with the following:

```env
# Stripe Keys (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# PayPal Credentials (Get from https://developer.paypal.com/dashboard/)
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

See `ENV_TEMPLATE.txt` for a complete template.

### 3️⃣ Seed Subscription Plans

```bash
npm run seed:subscriptions
```

This creates 3 subscription plans:
- **Basic**: $4.99/month → 500 coins
- **Premium**: $9.99/month → 1000 coins (Most Popular)
- **Pro**: $19.99/month → 2500 coins

### 4️⃣ Start the Server

```bash
npm run dev
```

### 5️⃣ Test the API

```bash
# Get all subscription plans
curl http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 Available Subscription Plans

| Plan | Monthly Price | Coins/Month | Discount | Status |
|------|--------------|-------------|----------|--------|
| Basic | $4.99 | 500 | - | Active |
| Premium | $9.99 | 1,000 | 10% | 🌟 Popular |
| Pro | $19.99 | 2,500 | 15% | Active |

### Plan Benefits

**Basic Plan**
- ✅ 500 coins per month
- ✅ Priority customer support
- ✅ Exclusive avatar frames

**Premium Plan** (Most Popular)
- ✅ 1000 coins per month
- ✅ Priority customer support
- ✅ Exclusive avatar frames
- ✅ Early access to new features
- ✅ Custom game themes

**Pro Plan**
- ✅ 2500 coins per month
- ✅ Priority customer support
- ✅ Exclusive avatar frames
- ✅ Early access to new features
- ✅ Custom game themes
- ✅ Exclusive character skins
- ✅ VIP game lobbies

---

## 🔌 API Endpoints

### Get Subscription Plans
```http
GET /api/v1/subscriptions
Authorization: Bearer {token}
```

### Get User's Subscriptions
```http
GET /api/v1/subscriptions/user
Authorization: Bearer {token}
```

### Create Stripe Subscription
```http
POST /api/v1/subscriptions/create/stripe
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscription_id": "66abc...",
  "currency": "usd"
}
```

### Create PayPal Subscription
```http
POST /api/v1/subscriptions/create/paypal
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscription_id": "66abc..."
}
```

### Confirm PayPal Subscription
```http
POST /api/v1/subscriptions/confirm/paypal
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscription_id": "66abc...",
  "paypal_subscription_id": "I-ABC123"
}
```

### Cancel Subscription
```http
POST /api/v1/subscriptions/{subscriptionId}/cancel
Authorization: Bearer {token}
```

### Get Transaction History
```http
GET /api/v1/subscriptions/transactions
Authorization: Bearer {token}
```

For complete API documentation, see **[SUBSCRIPTION_API.md](./SUBSCRIPTION_API.md)**

---

## 🔗 Webhook Setup

### Stripe Webhooks

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.com/api/v1/webhooks/stripe`
4. Select events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
5. Copy the webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

### PayPal Webhooks

1. Go to https://developer.paypal.com/dashboard/
2. Select your app → Webhooks
3. Add webhook URL: `https://your-domain.com/api/v1/webhooks/paypal`
4. Select event types:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `PAYMENT.SALE.COMPLETED`

### Test Webhooks Locally

Use Stripe CLI to test webhooks on localhost:

```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

---

## 💳 Payment Flow

### Stripe Flow

```
1. User selects subscription plan
2. Frontend calls: POST /subscriptions/create/stripe
3. Backend creates Stripe subscription
4. Backend returns client_secret
5. Frontend confirms payment with Stripe SDK
6. Stripe sends webhook: invoice.payment_succeeded
7. Backend adds coins to user account
8. Backend records transaction
```

### PayPal Flow

```
1. User selects subscription plan
2. Frontend calls: POST /subscriptions/create/paypal
3. Backend returns PayPal plan details
4. Frontend handles PayPal approval with SDK
5. User approves on PayPal
6. Frontend calls: POST /subscriptions/confirm/paypal
7. Backend creates subscription and adds coins
8. PayPal sends recurring webhooks for future payments
```

---

## 🧪 Testing

### Test Cards (Stripe)

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Declined |

Use any future expiry date and any 3-digit CVC.

### Test with Stripe CLI

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Trigger test events
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

### Test PayPal

Use PayPal Sandbox accounts:
- Create test accounts at https://developer.paypal.com/dashboard/accounts
- Use sandbox credentials in `.env` with `PAYPAL_MODE=sandbox`

---

## 📊 Database Schema

### Collections

**subscriptions**
- Stores subscription plan details
- Fields: name, description, coins_per_month, prices, benefits

**usersubscriptions**
- Tracks user's active subscriptions
- Fields: user_id, subscription_id, status, payment_method, period dates

**subscriptiontransactions**
- Records all payment transactions
- Fields: user_id, amount, status, coins_awarded, receipt_url

---

## 🔄 Subscription Lifecycle

```
┌─────────────┐
│   Created   │ User initiates subscription
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Trialing   │ Awaiting first payment
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Active    │ Payment successful, coins awarded
└──────┬──────┘
       │
       ├──────► Monthly renewal (auto)
       │
       ▼
┌─────────────┐
│  Cancelled  │ User cancels (end of period)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Expired   │ Subscription ends
└─────────────┘
```

### Status Values

- `active` - Subscription active, auto-renewing
- `trialing` - Pending first payment
- `cancelled` - Cancelled, ends at period end
- `expired` - Subscription ended
- `past_due` - Payment failed, retry pending

---

## 📱 Mobile App Integration

The subscription system is ready for your mobile app!

### Example: React Native

```javascript
import { useStripe } from '@stripe/stripe-react-native';

// Fetch plans
const response = await fetch('http://your-api/api/v1/subscriptions', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();
const plans = data.subscriptions;

// Create subscription
const subResponse = await fetch('http://your-api/api/v1/subscriptions/create/stripe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscription_id: selectedPlan.id,
    currency: 'usd'
  })
});

const { payment_intent } = await subResponse.json();

// Confirm payment
const { error } = await confirmPayment(payment_intent.client_secret, {
  paymentMethodType: 'Card',
});

if (!error) {
  // Success! Coins will be added automatically via webhook
}
```

---

## 🛠️ Maintenance

### Add New Plan

```javascript
db.subscriptions.insertOne({
  name: "Elite Plan",
  description: "For pro players",
  coins_per_month: 5000,
  price_usd: 39.99,
  price_eur: 34.00,
  price_gbp: 30.00,
  price_cny: 260.00,
  subscription_group: "werewolf_kill_subscription_group",
  duration_months: 1,
  benefits: [
    "5000 coins per month",
    "All premium features",
    "Exclusive tournaments"
  ],
  is_active: true
});
```

### Monitor Subscriptions

```javascript
// Active subscriptions count
db.usersubscriptions.countDocuments({ status: "active" })

// Monthly recurring revenue
db.usersubscriptions.aggregate([
  { $match: { status: "active" } },
  { $lookup: { 
      from: "subscriptions", 
      localField: "subscription_id", 
      foreignField: "_id", 
      as: "plan" 
  }},
  { $group: { _id: null, total: { $sum: "$plan.price_usd" } } }
])

// Failed payments today
db.subscriptiontransactions.find({
  status: "failed",
  created_at: { $gte: new Date(new Date().setHours(0,0,0,0)) }
})
```

---

## 🐛 Troubleshooting

### Problem: Webhooks not received

**Solution:**
1. Verify webhook URL is publicly accessible
2. Check webhook secret in `.env`
3. Review webhook logs in Stripe/PayPal dashboard
4. Ensure webhook route is before body parser in `index.js`

### Problem: Coins not added after payment

**Solution:**
1. Check server logs for webhook errors
2. Verify user subscription exists: `db.usersubscriptions.find()`
3. Check transaction record: `db.subscriptiontransactions.find()`
4. Resend webhook from provider dashboard

### Problem: "Subscription already exists"

**Solution:**
1. User already has active subscription for this plan
2. Cancel existing subscription first
3. Or allow user to upgrade/downgrade

---

## 📚 Documentation Files

- **[SUBSCRIPTION_SETUP.md](./SUBSCRIPTION_SETUP.md)** - Complete setup guide
- **[SUBSCRIPTION_API.md](./SUBSCRIPTION_API.md)** - Full API reference
- **[SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md](./SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md)** - Implementation details
- **[ENV_TEMPLATE.txt](./ENV_TEMPLATE.txt)** - Environment variables template

---

## 🎉 Success Checklist

- [x] ✅ Models created (Subscription, UserSubscription, SubscriptionTransaction)
- [x] ✅ Controllers implemented (subscription & webhook)
- [x] ✅ Routes registered (/api/v1/subscriptions, /api/v1/webhooks)
- [x] ✅ Stripe integration complete
- [x] ✅ PayPal integration complete
- [x] ✅ Webhook handlers implemented
- [x] ✅ Seed script created
- [x] ✅ Documentation complete
- [ ] Configure payment provider credentials
- [ ] Run seed script
- [ ] Set up webhooks
- [ ] Test with frontend app

---

## 📞 Support

If you encounter issues:

1. **Check Logs**: Review server console for error messages
2. **Verify Config**: Ensure all `.env` variables are set
3. **Test Webhooks**: Use provider test tools (Stripe CLI, PayPal sandbox)
4. **Database Check**: Query collections to verify data
5. **Documentation**: Refer to detailed docs in `SUBSCRIPTION_*.md` files

---

## 🚀 Production Deployment

Before deploying to production:

1. ✅ Switch to live API keys (remove `_test_` from Stripe keys)
2. ✅ Change `PAYPAL_MODE=live`
3. ✅ Update webhook URLs to production domain
4. ✅ Set `NODE_ENV=production`
5. ✅ Use strong `JWT_SECRET` values
6. ✅ Enable HTTPS
7. ✅ Configure production database
8. ✅ Test payment flow end-to-end
9. ✅ Monitor logs and webhooks
10. ✅ Set up error alerting

---

## 🌟 What's Next?

Your subscription system is ready! Now you can:

- 📱 Integrate with your mobile app
- 💎 Add more subscription tiers
- 🎁 Create promotional offers
- 📊 Analyze subscription metrics
- 🔔 Add email notifications
- 🏆 Implement loyalty rewards

**Happy Gaming! 🐺🎮**

