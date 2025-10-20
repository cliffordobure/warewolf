# 🎯 Werewolf Kill Subscription System - Setup Guide

## ✅ Implementation Status

The subscription system has been **fully implemented** and is ready to use! Here's what has been added:

### 📁 New Files Created

#### Models
- ✅ `src/models/Subscription.js` - Subscription plans schema
- ✅ `src/models/UserSubscription.js` - User subscription records
- ✅ `src/models/SubscriptionTransaction.js` - Transaction history

#### Controllers
- ✅ `src/controllers/subscriptionController.js` - Subscription CRUD operations
- ✅ `src/controllers/webhookController.js` - Payment webhooks for Stripe & PayPal

#### Routes
- ✅ `src/routes/subscription.js` - Subscription API endpoints
- ✅ `src/routes/webhook.js` - Webhook endpoints

#### Scripts
- ✅ `src/scripts/seedSubscriptions.js` - Seed sample subscription plans

---

## 🚀 Quick Start

### 1. Environment Variables

Add these variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_MODE=sandbox

# Frontend URL (for PayPal redirects)
FRONTEND_URL=http://localhost:5173
```

### 2. Seed Subscription Plans

Run the seed script to populate the database with sample subscription plans:

```bash
npm run seed:subscriptions
```

This will create 3 subscription plans:
- **Basic Plan**: 500 coins/month - $4.99
- **Premium Plan**: 1000 coins/month - $9.99 (Most Popular)
- **Pro Plan**: 2500 coins/month - $19.99

### 3. Start the Server

```bash
npm run dev
```

The subscription system is now available at: `http://localhost:3000/api/v1/subscriptions`

---

## 📚 API Endpoints

### Get All Subscriptions
```http
GET /api/v1/subscriptions
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "...",
        "name": "Basic Plan",
        "description": "Perfect for casual players",
        "coins_per_month": 500,
        "price_usd": 4.99,
        "price_eur": 4.25,
        "price_gbp": 3.75,
        "price_cny": 32.5,
        "benefits": ["500 coins per month", "Priority support", ...]
      }
    ]
  }
}
```

### Get User's Subscriptions
```http
GET /api/v1/subscriptions/user
Authorization: Bearer {access_token}
```

### Create Stripe Subscription
```http
POST /api/v1/subscriptions/create/stripe
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "subscription_id": "66abc...",
  "currency": "usd"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "...",
      "status": "active",
      "current_period_start": "2025-01-01T00:00:00Z",
      "current_period_end": "2025-02-01T00:00:00Z"
    },
    "payment_intent": {
      "client_secret": "pi_xxx_secret_xxx"
    }
  }
}
```

### Create PayPal Subscription
```http
POST /api/v1/subscriptions/create/paypal
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "subscription_id": "66abc..."
}
```

### Confirm PayPal Subscription
```http
POST /api/v1/subscriptions/confirm/paypal
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "subscription_id": "66abc...",
  "paypal_subscription_id": "I-ABC123"
}
```

### Cancel Subscription
```http
POST /api/v1/subscriptions/{subscriptionId}/cancel
Authorization: Bearer {access_token}
```

### Get Subscription Transactions
```http
GET /api/v1/subscriptions/transactions
Authorization: Bearer {access_token}
```

---

## 🔌 Webhook Configuration

### Stripe Webhooks

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
2. **Add endpoint**: `https://your-domain.com/api/v1/webhooks/stripe`
3. **Select events to listen to**:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
4. **Copy the webhook secret** and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### PayPal Webhooks

1. **Go to PayPal Developer Dashboard**: https://developer.paypal.com/dashboard/
2. **Navigate to**: Apps & Credentials → Your App → Webhooks
3. **Add webhook**: `https://your-domain.com/api/v1/webhooks/paypal`
4. **Select events**:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `PAYMENT.SALE.COMPLETED`

---

## 🧪 Testing

### Test with Stripe

Use Stripe's test card numbers:
- **Success**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

### Test Webhooks Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

---

## 💡 Key Features

### ✅ Implemented Features

1. **Multiple Payment Methods**: Stripe and PayPal support
2. **Recurring Billing**: Automatic monthly charges
3. **Webhook Integration**: Handles payment events automatically
4. **Transaction History**: Track all subscription payments
5. **Coin Distribution**: Automatically adds coins on successful payment
6. **Subscription Management**: Cancel, view status, and manage subscriptions
7. **Multi-Currency**: Support for USD, EUR, GBP, CNY
8. **Error Handling**: Comprehensive error handling and logging

### 🔄 Automatic Processes

- **Monthly Coin Grant**: Coins are automatically added when payment succeeds
- **Subscription Status**: Automatically updated based on payment events
- **Failed Payment Handling**: Marks subscription as "past_due" on failed payment
- **Cancellation**: Gracefully handles subscription cancellations

---

## 📊 Database Schema

### Subscriptions Collection
Stores subscription plans with pricing, benefits, and configuration.

### UserSubscriptions Collection
Tracks active subscriptions for each user with status and payment details.

### SubscriptionTransactions Collection
Records all payment transactions with receipts and coin awards.

---

## 🔒 Security Features

- ✅ Webhook signature verification (Stripe)
- ✅ Authentication required for all user endpoints
- ✅ Input validation on all requests
- ✅ Rate limiting on API endpoints
- ✅ Secure payment handling (no card data stored)

---

## 🐛 Troubleshooting

### Issue: Webhooks not working

**Solution**: 
- Verify webhook secret is correct in `.env`
- Check webhook URL is publicly accessible
- Ensure webhook route is before JSON body parser in `index.js`

### Issue: Coins not added after payment

**Solution**:
- Check webhook logs in console
- Verify user subscription exists in database
- Check transaction status in SubscriptionTransactions collection

### Issue: Stripe subscription creation fails

**Solution**:
- Verify Stripe API key is correct
- Check subscription plan exists and is active
- Ensure user doesn't already have active subscription

---

## 📱 Frontend Integration

The subscription system is designed to work seamlessly with your mobile app:

1. **Fetch subscriptions**: Call `GET /api/v1/subscriptions`
2. **User selects plan**: Show subscription options
3. **Create subscription**: Call appropriate endpoint (Stripe/PayPal)
4. **Handle payment**: 
   - Stripe: Use `client_secret` with Stripe SDK
   - PayPal: Redirect to approval URL, then confirm
5. **Display status**: Show active subscriptions from `GET /api/v1/subscriptions/user`

---

## 🎉 Success!

Your subscription system is now fully operational! The mobile app can:

- ✅ View all available subscription plans
- ✅ Purchase subscriptions with Stripe or PayPal
- ✅ Receive monthly coins automatically
- ✅ Manage and cancel subscriptions
- ✅ View transaction history

For questions or issues, check the console logs or review the webhook events in your payment provider dashboard.

---

## 📞 Support

If you encounter any issues:

1. Check server logs for error messages
2. Verify all environment variables are set correctly
3. Test webhooks using provider test tools
4. Review transaction records in the database

Happy gaming! 🐺🎮

