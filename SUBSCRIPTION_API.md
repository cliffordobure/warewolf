# 📡 Subscription API Reference

## Base URL
```
http://localhost:3000/api/v1
```

---

## 🔐 Authentication

All subscription endpoints (except webhook endpoints) require authentication via Bearer token:

```http
Authorization: Bearer {access_token}
```

---

## 📋 Endpoints

### 1. Get All Subscriptions

Retrieves all active subscription plans.

```http
GET /subscriptions
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Subscriptions retrieved successfully",
  "data": {
    "subscriptions": [
      {
        "id": "66abc123...",
        "name": "Basic Plan",
        "description": "Perfect for casual players",
        "coins_per_month": 500,
        "price_usd": 4.99,
        "price_eur": 4.25,
        "price_gbp": 3.75,
        "price_cny": 32.5,
        "image_url": null,
        "is_popular": false,
        "discount_percent": null,
        "subscription_group": "werewolf_kill_subscription_group",
        "duration_months": 1,
        "benefits": [
          "500 coins per month",
          "Priority customer support",
          "Exclusive avatar frames"
        ]
      }
    ]
  }
}
```

---

### 2. Get User Subscriptions

Retrieves all subscriptions for the authenticated user.

```http
GET /subscriptions/user
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "success": true,
  "message": "User subscriptions retrieved successfully",
  "data": {
    "subscriptions": [
      {
        "id": "66def456...",
        "subscription": {
          "id": "66abc123...",
          "name": "Premium Plan",
          "description": "Great value for regular players",
          "coins_per_month": 1000,
          "price_usd": 9.99,
          "benefits": ["1000 coins per month", "Priority support", ...]
        },
        "status": "active",
        "payment_method": "stripe",
        "current_period_start": "2025-01-01T00:00:00.000Z",
        "current_period_end": "2025-02-01T00:00:00.000Z",
        "cancel_at_period_end": false,
        "cancelled_at": null,
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Create Stripe Subscription

Creates a new subscription using Stripe as the payment method.

```http
POST /subscriptions/create/stripe
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "subscription_id": "66abc123...",
  "currency": "usd"
}
```

**Parameters:**
- `subscription_id` (required): MongoDB ObjectId of the subscription plan
- `currency` (optional): Payment currency - `usd`, `eur`, `gbp`, or `cny`. Default: `usd`

**Response 200:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "id": "66def456...",
      "status": "trialing",
      "current_period_start": "2025-01-01T00:00:00.000Z",
      "current_period_end": "2025-02-01T00:00:00.000Z"
    },
    "payment_intent": {
      "client_secret": "pi_3AbcDefGhiJkl123_secret_XyZ789..."
    }
  }
}
```

**Usage with Stripe SDK (Frontend):**
```javascript
// After receiving the client_secret
const stripe = useStripe();
const { error, paymentIntent } = await stripe.confirmCardPayment(
  client_secret,
  {
    payment_method: {
      card: cardElement,
      billing_details: { email: userEmail }
    }
  }
);
```

**Error Responses:**

**404 - Subscription Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "Subscription not found"
  }
}
```

**400 - Already Subscribed:**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_EXISTS",
    "message": "You already have an active subscription for this plan"
  }
}
```

---

### 4. Create PayPal Subscription

Initiates a PayPal subscription. Returns subscription details for frontend to complete PayPal flow.

```http
POST /subscriptions/create/paypal
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "subscription_id": "66abc123..."
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Subscription details retrieved",
  "data": {
    "subscription_plan": {
      "id": "66abc123...",
      "name": "Premium Plan",
      "price_usd": 9.99,
      "coins_per_month": 1000,
      "paypal_plan_id": "P-ABC123..."
    },
    "message": "Please complete PayPal subscription on frontend"
  }
}
```

**Next Step:**
After user approves PayPal subscription on frontend, call the confirmation endpoint.

---

### 5. Confirm PayPal Subscription

Confirms and activates a PayPal subscription after user approval.

```http
POST /subscriptions/confirm/paypal
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "subscription_id": "66abc123...",
  "paypal_subscription_id": "I-ABC123XYZ789"
}
```

**Parameters:**
- `subscription_id` (required): MongoDB ObjectId of the subscription plan
- `paypal_subscription_id` (required): PayPal subscription ID received after user approval

**Response 200:**
```json
{
  "success": true,
  "message": "PayPal subscription confirmed successfully",
  "data": {
    "subscription": {
      "id": "66def456...",
      "status": "active",
      "current_period_start": "2025-01-01T00:00:00.000Z",
      "current_period_end": "2025-01-31T00:00:00.000Z"
    }
  }
}
```

---

### 6. Cancel Subscription

Cancels an active subscription. For Stripe, cancels at period end. For PayPal, cancels immediately.

```http
POST /subscriptions/{subscriptionId}/cancel
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**URL Parameters:**
- `subscriptionId`: MongoDB ObjectId of the user's subscription

**Response 200:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": {
      "id": "66def456...",
      "status": "active",
      "cancel_at_period_end": true,
      "cancelled_at": "2025-01-15T10:30:00.000Z",
      "current_period_end": "2025-02-01T00:00:00.000Z"
    }
  }
}
```

**Note for Stripe:**
- Subscription remains active until period end
- User continues to receive benefits until `current_period_end`
- No refund for current period

**Error Responses:**

**404 - Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "Subscription not found"
  }
}
```

**400 - Already Cancelled:**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_ALREADY_CANCELLED",
    "message": "Subscription already cancelled"
  }
}
```

---

### 7. Get Subscription Transactions

Retrieves transaction history for the authenticated user.

```http
GET /subscriptions/transactions
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "66xyz789...",
        "subscription_name": "Premium Plan",
        "amount": 9.99,
        "currency": "USD",
        "payment_method": "stripe",
        "status": "completed",
        "coins_awarded": 1000,
        "receipt_url": "https://invoice.stripe.com/...",
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Transaction Statuses:**
- `pending`: Payment initiated but not completed
- `completed`: Payment successful, coins awarded
- `failed`: Payment failed
- `refunded`: Payment refunded

---

## 🔗 Webhook Endpoints

### Stripe Webhook

**Important:** This endpoint receives raw request body for signature verification.

```http
POST /webhooks/stripe
```

**Headers:**
```
stripe-signature: t=...,v1=...
Content-Type: application/json
```

**Events Handled:**
- `invoice.payment_succeeded` - Payment successful, coins added
- `invoice.payment_failed` - Payment failed, subscription marked past_due
- `customer.subscription.updated` - Subscription details updated
- `customer.subscription.deleted` - Subscription cancelled
- `customer.subscription.trial_will_end` - Trial ending notification

**Response:**
```json
{
  "received": true
}
```

---

### PayPal Webhook

```http
POST /webhooks/paypal
```

**Events Handled:**
- `BILLING.SUBSCRIPTION.ACTIVATED` - Subscription activated
- `BILLING.SUBSCRIPTION.CANCELLED` - Subscription cancelled
- `BILLING.SUBSCRIPTION.EXPIRED` - Subscription expired
- `PAYMENT.SALE.COMPLETED` - Payment received, coins added

**Response:**
```json
{
  "received": true
}
```

---

## 📊 Status Values

### Subscription Status

- `active` - Subscription is active and renewing
- `trialing` - In trial period or pending first payment
- `cancelled` - Subscription cancelled
- `expired` - Subscription expired after cancellation
- `past_due` - Payment failed, awaiting retry

### Payment Method

- `stripe` - Payment via Stripe
- `paypal` - Payment via PayPal

### Transaction Status

- `pending` - Transaction initiated
- `completed` - Transaction successful
- `failed` - Transaction failed
- `refunded` - Transaction refunded

---

## 🔄 Subscription Lifecycle

1. **Creation**: User selects plan and payment method
2. **Payment**: First payment processed
3. **Active**: Subscription active, coins awarded
4. **Renewal**: Monthly automatic payment
5. **Cancellation**: User cancels (Stripe: at period end, PayPal: immediate)
6. **Expiration**: Subscription ends

---

## 💡 Integration Examples

### Complete Stripe Flow

```javascript
// 1. Fetch subscription plans
const plans = await fetch('/api/v1/subscriptions', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. User selects a plan
const selectedPlan = plans.data.subscriptions[1]; // Premium

// 3. Create subscription
const response = await fetch('/api/v1/subscriptions/create/stripe', {
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

const { payment_intent } = response.data;

// 4. Confirm payment with Stripe SDK
const { error } = await stripe.confirmCardPayment(
  payment_intent.client_secret,
  { payment_method: { card: cardElement } }
);

// 5. Check subscription status
const userSubs = await fetch('/api/v1/subscriptions/user', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### Complete PayPal Flow

```javascript
// 1. Create PayPal subscription request
const response = await fetch('/api/v1/subscriptions/create/paypal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscription_id: selectedPlan.id
  })
});

// 2. Use PayPal SDK on frontend to complete payment
// User approves PayPal subscription

// 3. Confirm subscription after approval
const confirm = await fetch('/api/v1/subscriptions/confirm/paypal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscription_id: selectedPlan.id,
    paypal_subscription_id: paypalSubId
  })
});
```

---

## 🛡️ Security Notes

1. **Always verify webhook signatures** before processing
2. **Never store card details** - handled by payment providers
3. **Use HTTPS in production** for all API calls
4. **Rate limit** sensitive endpoints
5. **Log all transactions** for audit trail

---

## 🐛 Common Issues

### Issue: "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Ensure raw body is passed to webhook handler
- Check webhook is registered in Stripe dashboard

### Issue: "Subscription not found"
- Verify subscription ID is valid MongoDB ObjectId
- Check subscription exists in database
- Ensure subscription is active

### Issue: "You already have an active subscription"
- User already has active subscription for this plan
- Check existing subscriptions with `/subscriptions/user`
- Cancel existing subscription first if switching plans

---

## 📞 Support

For technical issues:
1. Check server logs for detailed error messages
2. Verify environment variables are configured
3. Test webhooks using provider test tools
4. Review transaction records in database

Enjoy building with the Werewolf Kill Subscription API! 🐺✨

