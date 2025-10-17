const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopItem',
    required: true
  },
  item_name: {
    type: String,
    required: true
  },
  coins: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['USD', 'EUR', 'GBP', 'CNY']
  },
  payment_method: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal']
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'completed', 'failed', 'refunded']
  },
  transaction_id: {
    type: String,
    default: null
  },
  payment_intent_id: {
    type: String,
    default: null
  },
  order_id: {
    type: String,
    default: null
  },
  receipt_url: {
    type: String,
    default: null
  },
  payer_email: {
    type: String,
    default: null
  },
  payer_name: {
    type: String,
    default: null
  },
  error_message: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
transactionSchema.index({ user_id: 1, created_at: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ payment_intent_id: 1 });
transactionSchema.index({ order_id: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

