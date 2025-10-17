const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [255, 'Item name must be less than 255 characters']
  },
  description: {
    type: String,
    trim: true
  },
  coins: {
    type: Number,
    required: [true, 'Coins amount is required'],
    min: 0
  },
  price_usd: {
    type: Number,
    min: 0
  },
  price_eur: {
    type: Number,
    min: 0
  },
  price_gbp: {
    type: Number,
    min: 0
  },
  price_cny: {
    type: Number,
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
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for active items
shopItemSchema.index({ is_active: 1, created_at: -1 });

module.exports = mongoose.model('ShopItem', shopItemSchema);

