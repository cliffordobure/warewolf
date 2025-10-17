require('dotenv').config();
const mongoose = require('mongoose');
const ShopItem = require('../models/ShopItem');

const shopItems = [
  {
    name: '100 Coins Pack',
    description: 'Perfect for new players to get started',
    coins: 100,
    price_usd: 0.99,
    price_eur: 0.85,
    price_gbp: 0.75,
    price_cny: 6.50,
    image_url: null,
    is_popular: false,
    discount_percent: null,
    is_active: true
  },
  {
    name: '500 Coins Pack',
    description: 'Great value for regular players',
    coins: 500,
    price_usd: 4.99,
    price_eur: 4.25,
    price_gbp: 3.75,
    price_cny: 32.50,
    image_url: null,
    is_popular: true,
    discount_percent: 10,
    is_active: true
  },
  {
    name: '1000 Coins Pack',
    description: 'Best value! Most popular choice',
    coins: 1000,
    price_usd: 9.99,
    price_eur: 8.50,
    price_gbp: 7.50,
    price_cny: 65.00,
    image_url: null,
    is_popular: true,
    discount_percent: 15,
    is_active: true
  },
  {
    name: '2500 Coins Pack',
    description: 'For dedicated players',
    coins: 2500,
    price_usd: 19.99,
    price_eur: 17.00,
    price_gbp: 15.00,
    price_cny: 130.00,
    image_url: null,
    is_popular: false,
    discount_percent: 20,
    is_active: true
  },
  {
    name: '5000 Coins Pack',
    description: 'Maximum value pack!',
    coins: 5000,
    price_usd: 39.99,
    price_eur: 34.00,
    price_gbp: 30.00,
    price_cny: 260.00,
    image_url: null,
    is_popular: false,
    discount_percent: 25,
    is_active: true
  }
];

async function seedShop() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing shop items
    await ShopItem.deleteMany({});
    console.log('Cleared existing shop items');

    // Insert new shop items
    const created = await ShopItem.insertMany(shopItems);
    console.log(`Created ${created.length} shop items`);

    console.log('\nShop items:');
    created.forEach(item => {
      console.log(`- ${item.name}: ${item.coins} coins ($${item.price_usd})`);
    });

    console.log('\n✓ Shop seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding shop:', error);
    process.exit(1);
  }
}

seedShop();

