const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subscription name is required'],
    trim: true,
    maxlength: [255, 'Subscription name must be less than 255 characters']
  },
  description: {
    type: String,
    trim: true
  },
  coins_per_month: {
    type: Number,
    required: [true, 'Coins per month is required'],
    min: 0
  },
  price_usd: {
    type: Number,
    required: [true, 'USD price is required'],
    min: 0
  },
  price_eur: {
    type: Number,
    required: [true, 'EUR price is required'],
    min: 0
  },
  price_gbp: {
    type: Number,
    required: [true, 'GBP price is required'],
    min: 0
  },
  price_cny: {
    type: Number,
    required: [true, 'CNY price is required'],
    min: 0
  },
  image_url: {
    type: String,
    default: null
  },
  is_popular: {
    type: Boolean,
    default: false
  },
  discount_percent: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  subscription_group: {
    type: String,
    default: 'werewolf_kill_subscription_group'
  },
  duration_months: {
    type: Number,
    default: 1,
    min: 1
  },
  benefits: {
    type: [String],
    default: []
  },
  is_active: {
    type: Boolean,
    default: true
  },
  stripe_product_id: {
    type: String,
    default: null
  },
  stripe_price_id: {
    type: String,
    default: null
  },
  paypal_plan_id: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for active subscriptions
subscriptionSchema.index({ is_active: 1, subscription_group: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);

