const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: [true, 'Subscription ID is required']
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trialing', 'past_due'],
    default: 'active'
  },
  stripe_subscription_id: {
    type: String,
    default: null
  },
  stripe_customer_id: {
    type: String,
    default: null
  },
  paypal_subscription_id: {
    type: String,
    default: null
  },
  payment_method: {
    type: String,
    enum: ['stripe', 'paypal'],
    required: [true, 'Payment method is required']
  },
  current_period_start: {
    type: Date,
    default: null
  },
  current_period_end: {
    type: Date,
    default: null
  },
  cancel_at_period_end: {
    type: Boolean,
    default: false
  },
  cancelled_at: {
    type: Date,
    default: null
  },
  trial_end: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for user subscriptions lookup
userSubscriptionSchema.index({ user_id: 1, status: 1 });
userSubscriptionSchema.index({ stripe_subscription_id: 1 });
userSubscriptionSchema.index({ paypal_subscription_id: 1 });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);

