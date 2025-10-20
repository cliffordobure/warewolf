const mongoose = require('mongoose');

const subscriptionTransactionSchema = new mongoose.Schema({
  user_subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    required: [true, 'User subscription ID is required']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    maxlength: 3
  },
  payment_method: {
    type: String,
    enum: ['stripe', 'paypal'],
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  stripe_payment_intent_id: {
    type: String,
    default: null
  },
  stripe_invoice_id: {
    type: String,
    default: null
  },
  paypal_order_id: {
    type: String,
    default: null
  },
  receipt_url: {
    type: String,
    default: null
  },
  error_message: {
    type: String,
    default: null
  },
  coins_awarded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for transaction lookup
subscriptionTransactionSchema.index({ user_subscription_id: 1, created_at: -1 });
subscriptionTransactionSchema.index({ user_id: 1, status: 1 });
subscriptionTransactionSchema.index({ stripe_payment_intent_id: 1 });
subscriptionTransactionSchema.index({ paypal_order_id: 1 });

module.exports = mongoose.model('SubscriptionTransaction', subscriptionTransactionSchema);

