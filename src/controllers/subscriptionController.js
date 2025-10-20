const Subscription = require('../models/Subscription');
const UserSubscription = require('../models/UserSubscription');
const SubscriptionTransaction = require('../models/SubscriptionTransaction');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get all active subscriptions
exports.getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ 
      is_active: true,
      subscription_group: 'werewolf_kill_subscription_group'
    }).sort({ price_usd: 1 });

    const subscriptionsResponse = subscriptions.map(sub => ({
      id: sub._id,
      name: sub.name,
      description: sub.description,
      coins_per_month: sub.coins_per_month,
      price_usd: sub.price_usd,
      price_eur: sub.price_eur,
      price_gbp: sub.price_gbp,
      price_cny: sub.price_cny,
      image_url: sub.image_url,
      is_popular: sub.is_popular,
      discount_percent: sub.discount_percent,
      subscription_group: sub.subscription_group,
      duration_months: sub.duration_months,
      benefits: sub.benefits
    }));

    return ApiResponse.success(
      res,
      { subscriptions: subscriptionsResponse },
      'Subscriptions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Get user's subscriptions
exports.getUserSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const userSubscriptions = await UserSubscription.find({ 
      user_id: userId 
    })
    .populate('subscription_id')
    .sort({ created_at: -1 });

    const subscriptionsResponse = userSubscriptions.map(userSub => ({
      id: userSub._id,
      subscription: {
        id: userSub.subscription_id._id,
        name: userSub.subscription_id.name,
        description: userSub.subscription_id.description,
        coins_per_month: userSub.subscription_id.coins_per_month,
        price_usd: userSub.subscription_id.price_usd,
        benefits: userSub.subscription_id.benefits
      },
      status: userSub.status,
      payment_method: userSub.payment_method,
      current_period_start: userSub.current_period_start,
      current_period_end: userSub.current_period_end,
      cancel_at_period_end: userSub.cancel_at_period_end,
      cancelled_at: userSub.cancelled_at,
      created_at: userSub.created_at
    }));

    return ApiResponse.success(
      res,
      { subscriptions: subscriptionsResponse },
      'User subscriptions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Create a new subscription (Stripe)
exports.createStripeSubscription = async (req, res, next) => {
  try {
    const { subscription_id, currency = 'usd' } = req.body;
    const userId = req.user._id;
    const userEmail = req.user.email;
    const username = req.user.username;

    // Validate subscription exists
    const subscription = await Subscription.findById(subscription_id);
    if (!subscription) {
      return ApiResponse.error(res, 'Subscription not found', 'SUBSCRIPTION_NOT_FOUND', 404);
    }

    if (!subscription.is_active) {
      return ApiResponse.error(res, 'Subscription not available', 'SUBSCRIPTION_UNAVAILABLE', 400);
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      user_id: userId,
      subscription_id: subscription_id,
      status: { $in: ['active', 'trialing'] }
    });

    if (existingSubscription) {
      return ApiResponse.error(
        res, 
        'You already have an active subscription for this plan', 
        'SUBSCRIPTION_EXISTS', 
        400
      );
    }

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        name: username,
        metadata: {
          user_id: userId.toString()
        }
      });
    }

    // Get price based on currency
    const priceMap = {
      usd: subscription.price_usd,
      eur: subscription.price_eur,
      gbp: subscription.price_gbp,
      cny: subscription.price_cny
    };

    const price = priceMap[currency.toLowerCase()] || subscription.price_usd;

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: subscription.name,
            description: subscription.description,
          },
          unit_amount: Math.round(price * 100), // Convert to cents
          recurring: {
            interval: 'month',
            interval_count: subscription.duration_months
          },
        },
      }],
      metadata: {
        subscription_group: 'werewolf_kill_subscription_group',
        user_id: userId.toString(),
        subscription_id: subscription_id.toString()
      },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Calculate period dates
    const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);

    // Save user subscription
    const userSubscription = new UserSubscription({
      user_id: userId,
      subscription_id: subscription_id,
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: customer.id,
      payment_method: 'stripe',
      status: stripeSubscription.status === 'incomplete' ? 'trialing' : 'active',
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
    });

    await userSubscription.save();

    // Create initial transaction record
    const transaction = new SubscriptionTransaction({
      user_subscription_id: userSubscription._id,
      user_id: userId,
      amount: price,
      currency: currency.toUpperCase(),
      payment_method: 'stripe',
      status: 'pending',
      stripe_payment_intent_id: stripeSubscription.latest_invoice.payment_intent?.id,
      stripe_invoice_id: stripeSubscription.latest_invoice.id
    });

    await transaction.save();

    return ApiResponse.success(
      res,
      {
        subscription: {
          id: userSubscription._id,
          status: userSubscription.status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd
        },
        payment_intent: {
          client_secret: stripeSubscription.latest_invoice.payment_intent?.client_secret
        }
      },
      'Subscription created successfully'
    );
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    next(error);
  }
};

// Create PayPal subscription
exports.createPayPalSubscription = async (req, res, next) => {
  try {
    const { subscription_id } = req.body;
    const userId = req.user._id;

    // Validate subscription exists
    const subscription = await Subscription.findById(subscription_id);
    if (!subscription) {
      return ApiResponse.error(res, 'Subscription not found', 'SUBSCRIPTION_NOT_FOUND', 404);
    }

    if (!subscription.is_active) {
      return ApiResponse.error(res, 'Subscription not available', 'SUBSCRIPTION_UNAVAILABLE', 400);
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      user_id: userId,
      subscription_id: subscription_id,
      status: { $in: ['active', 'trialing'] }
    });

    if (existingSubscription) {
      return ApiResponse.error(
        res, 
        'You already have an active subscription for this plan', 
        'SUBSCRIPTION_EXISTS', 
        400
      );
    }

    // For PayPal, we'll return the subscription details and let the frontend handle the PayPal flow
    // The frontend will use PayPal SDK to create the subscription and then call a confirmation endpoint

    return ApiResponse.success(
      res,
      {
        subscription_plan: {
          id: subscription._id,
          name: subscription.name,
          price_usd: subscription.price_usd,
          coins_per_month: subscription.coins_per_month,
          paypal_plan_id: subscription.paypal_plan_id
        },
        message: 'Please complete PayPal subscription on frontend'
      },
      'Subscription details retrieved'
    );
  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    next(error);
  }
};

// Confirm PayPal subscription (called after user approves on frontend)
exports.confirmPayPalSubscription = async (req, res, next) => {
  try {
    const { subscription_id, paypal_subscription_id } = req.body;
    const userId = req.user._id;

    // Validate subscription exists
    const subscription = await Subscription.findById(subscription_id);
    if (!subscription) {
      return ApiResponse.error(res, 'Subscription not found', 'SUBSCRIPTION_NOT_FOUND', 404);
    }

    // Save user subscription
    const userSubscription = new UserSubscription({
      user_id: userId,
      subscription_id: subscription_id,
      paypal_subscription_id: paypal_subscription_id,
      payment_method: 'paypal',
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    await userSubscription.save();

    // Add initial coins to user
    await User.findByIdAndUpdate(userId, {
      $inc: { coins: subscription.coins_per_month }
    });

    // Create transaction record
    const transaction = new SubscriptionTransaction({
      user_subscription_id: userSubscription._id,
      user_id: userId,
      amount: subscription.price_usd,
      currency: 'USD',
      payment_method: 'paypal',
      status: 'completed',
      paypal_order_id: paypal_subscription_id,
      coins_awarded: subscription.coins_per_month
    });

    await transaction.save();

    return ApiResponse.success(
      res,
      {
        subscription: {
          id: userSubscription._id,
          status: userSubscription.status,
          current_period_start: userSubscription.current_period_start,
          current_period_end: userSubscription.current_period_end
        }
      },
      'PayPal subscription confirmed successfully'
    );
  } catch (error) {
    console.error('Error confirming PayPal subscription:', error);
    next(error);
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user._id;

    const userSubscription = await UserSubscription.findOne({
      _id: subscriptionId,
      user_id: userId
    });

    if (!userSubscription) {
      return ApiResponse.error(res, 'Subscription not found', 'SUBSCRIPTION_NOT_FOUND', 404);
    }

    if (userSubscription.status === 'cancelled' || userSubscription.status === 'expired') {
      return ApiResponse.error(res, 'Subscription already cancelled', 'SUBSCRIPTION_ALREADY_CANCELLED', 400);
    }

    // Cancel on payment provider
    if (userSubscription.payment_method === 'stripe' && userSubscription.stripe_subscription_id) {
      await stripe.subscriptions.update(userSubscription.stripe_subscription_id, {
        cancel_at_period_end: true
      });

      userSubscription.cancel_at_period_end = true;
    } else if (userSubscription.payment_method === 'paypal' && userSubscription.paypal_subscription_id) {
      // PayPal cancellation would be handled here
      // For now, we'll just mark it as cancelled immediately
      userSubscription.status = 'cancelled';
      userSubscription.cancelled_at = new Date();
    }

    await userSubscription.save();

    return ApiResponse.success(
      res,
      { subscription: userSubscription },
      'Subscription cancelled successfully'
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    next(error);
  }
};

// Get subscription transactions for a user
exports.getSubscriptionTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const transactions = await SubscriptionTransaction.find({ user_id: userId })
      .populate({
        path: 'user_subscription_id',
        populate: {
          path: 'subscription_id'
        }
      })
      .sort({ created_at: -1 })
      .limit(50);

    const transactionsResponse = transactions.map(txn => ({
      id: txn._id,
      subscription_name: txn.user_subscription_id?.subscription_id?.name,
      amount: txn.amount,
      currency: txn.currency,
      payment_method: txn.payment_method,
      status: txn.status,
      coins_awarded: txn.coins_awarded,
      receipt_url: txn.receipt_url,
      created_at: txn.created_at
    }));

    return ApiResponse.success(
      res,
      { transactions: transactionsResponse },
      'Transactions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

