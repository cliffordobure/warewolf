require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');

const subscriptionPlans = [
  {
    name: 'Basic Plan',
    description: 'Perfect for casual players',
    coins_per_month: 500,
    price_usd: 4.99,
    price_eur: 4.25,
    price_gbp: 3.75,
    price_cny: 32.50,
    image_url: null,
    is_popular: false,
    discount_percent: null,
    subscription_group: 'werewolf_kill_subscription_group',
    duration_months: 1,
    benefits: [
      '500 coins per month',
      'Priority customer support',
      'Exclusive avatar frames'
    ],
    is_active: true
  },
  {
    name: 'Premium Plan',
    description: 'Great value for regular players',
    coins_per_month: 1000,
    price_usd: 9.99,
    price_eur: 8.50,
    price_gbp: 7.50,
    price_cny: 65.00,
    image_url: null,
    is_popular: true,
    discount_percent: 10,
    subscription_group: 'werewolf_kill_subscription_group',
    duration_months: 1,
    benefits: [
      '1000 coins per month',
      'Priority customer support',
      'Exclusive avatar frames',
      'Early access to new features',
      'Custom game themes'
    ],
    is_active: true
  },
  {
    name: 'Pro Plan',
    description: 'For dedicated players',
    coins_per_month: 2500,
    price_usd: 19.99,
    price_eur: 17.00,
    price_gbp: 15.00,
    price_cny: 130.00,
    image_url: null,
    is_popular: false,
    discount_percent: 15,
    subscription_group: 'werewolf_kill_subscription_group',
    duration_months: 1,
    benefits: [
      '2500 coins per month',
      'Priority customer support',
      'Exclusive avatar frames',
      'Early access to new features',
      'Custom game themes',
      'Exclusive character skins',
      'VIP game lobbies'
    ],
    is_active: true
  }
];

async function seedSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Clear existing subscriptions
    await Subscription.deleteMany({ subscription_group: 'werewolf_kill_subscription_group' });
    console.log('Cleared existing subscription plans');

    // Insert new subscription plans
    const created = await Subscription.insertMany(subscriptionPlans);
    console.log(`Created ${created.length} subscription plans`);

    console.log('\n📋 Subscription plans:');
    created.forEach(sub => {
      console.log(`\n✨ ${sub.name}`);
      console.log(`   💰 $${sub.price_usd}/month`);
      console.log(`   🪙 ${sub.coins_per_month} coins/month`);
      console.log(`   📝 ${sub.description}`);
      if (sub.is_popular) {
        console.log(`   ⭐ MOST POPULAR`);
      }
      if (sub.discount_percent) {
        console.log(`   🎁 ${sub.discount_percent}% discount`);
      }
      console.log(`   Benefits:`);
      sub.benefits.forEach(benefit => {
        console.log(`      • ${benefit}`);
      });
    });

    console.log('\n✅ Subscription seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Configure Stripe API keys in .env');
    console.log('   2. Configure PayPal API keys in .env');
    console.log('   3. Set up webhook endpoints in Stripe/PayPal dashboard');
    console.log('   4. Test subscription creation and payment flow');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding subscriptions:', error);
    process.exit(1);
  }
}

seedSubscriptions();

