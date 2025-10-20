const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const UserSubscription = require('../models/UserSubscription');
const SubscriptionTransaction = require('../models/SubscriptionTransaction');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Stripe webhook handler
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handle successful payment
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log('💰 Processing successful payment for invoice:', invoice.id);

    // Get the subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    // Find the user subscription in our database
    const userSubscription = await UserSubscription.findOne({
      stripe_subscription_id: stripeSubscription.id
    }).populate('subscription_id');

    if (!userSubscription) {
      console.error('User subscription not found for Stripe subscription:', stripeSubscription.id);
      return;
    }

    // Check if this is the first payment or a renewal
    const isFirstPayment = invoice.billing_reason === 'subscription_create';
    
    // Update subscription period
    userSubscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
    userSubscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
    userSubscription.status = 'active';
    await userSubscription.save();

    // Add coins to user account
    const coinsToAdd = userSubscription.subscription_id.coins_per_month;
    await User.findByIdAndUpdate(userSubscription.user_id, {
      $inc: { coins: coinsToAdd }
    });

    console.log(`✅ Added ${coinsToAdd} coins to user ${userSubscription.user_id}`);

    // Update or create transaction record
    let transaction = await SubscriptionTransaction.findOne({
      stripe_invoice_id: invoice.id
    });

    if (transaction) {
      // Update existing transaction
      transaction.status = 'completed';
      transaction.receipt_url = invoice.hosted_invoice_url;
      transaction.coins_awarded = coinsToAdd;
    } else {
      // Create new transaction record
      transaction = new SubscriptionTransaction({
        user_subscription_id: userSubscription._id,
        user_id: userSubscription.user_id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        payment_method: 'stripe',
        status: 'completed',
        stripe_payment_intent_id: invoice.payment_intent,
        stripe_invoice_id: invoice.id,
        receipt_url: invoice.hosted_invoice_url,
        coins_awarded: coinsToAdd
      });
    }

    await transaction.save();
    console.log('✅ Transaction saved successfully');

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('❌ Processing failed payment for invoice:', invoice.id);

    const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    const userSubscription = await UserSubscription.findOne({
      stripe_subscription_id: stripeSubscription.id
    });

    if (!userSubscription) {
      console.error('User subscription not found for Stripe subscription:', stripeSubscription.id);
      return;
    }

    // Update subscription status
    userSubscription.status = 'past_due';
    await userSubscription.save();

    // Create or update transaction record
    let transaction = await SubscriptionTransaction.findOne({
      stripe_invoice_id: invoice.id
    });

    if (transaction) {
      transaction.status = 'failed';
      transaction.error_message = invoice.last_finalization_error?.message || 'Payment failed';
    } else {
      transaction = new SubscriptionTransaction({
        user_subscription_id: userSubscription._id,
        user_id: userSubscription.user_id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        payment_method: 'stripe',
        status: 'failed',
        stripe_payment_intent_id: invoice.payment_intent,
        stripe_invoice_id: invoice.id,
        error_message: invoice.last_finalization_error?.message || 'Payment failed'
      });
    }

    await transaction.save();
    console.log('⚠️  Subscription marked as past_due');

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(stripeSubscription) {
  try {
    console.log('🔄 Processing subscription update:', stripeSubscription.id);

    const userSubscription = await UserSubscription.findOne({
      stripe_subscription_id: stripeSubscription.id
    });

    if (!userSubscription) {
      console.error('User subscription not found for Stripe subscription:', stripeSubscription.id);
      return;
    }

    // Update subscription details
    userSubscription.status = stripeSubscription.status;
    userSubscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
    userSubscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
    userSubscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end;

    await userSubscription.save();
    console.log('✅ Subscription updated successfully');

  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription deleted/cancelled
async function handleSubscriptionDeleted(stripeSubscription) {
  try {
    console.log('🗑️  Processing subscription deletion:', stripeSubscription.id);

    const userSubscription = await UserSubscription.findOne({
      stripe_subscription_id: stripeSubscription.id
    });

    if (!userSubscription) {
      console.error('User subscription not found for Stripe subscription:', stripeSubscription.id);
      return;
    }

    // Mark subscription as cancelled
    userSubscription.status = 'cancelled';
    userSubscription.cancelled_at = new Date();
    await userSubscription.save();

    console.log('✅ Subscription cancelled successfully');

  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle trial ending soon
async function handleTrialWillEnd(stripeSubscription) {
  try {
    console.log('⏰ Trial will end soon for subscription:', stripeSubscription.id);

    const userSubscription = await UserSubscription.findOne({
      stripe_subscription_id: stripeSubscription.id
    });

    if (!userSubscription) {
      console.error('User subscription not found for Stripe subscription:', stripeSubscription.id);
      return;
    }

    // You could send a notification to the user here
    console.log(`⚠️  Trial ending soon for user ${userSubscription.user_id}`);
    
    // TODO: Implement email/push notification to user

  } catch (error) {
    console.error('Error handling trial ending:', error);
  }
}

// PayPal webhook handler
exports.handlePayPalWebhook = async (req, res) => {
  try {
    const webhookEvent = req.body;
    
    console.log('PayPal Webhook Event:', webhookEvent.event_type);

    // Handle different PayPal webhook events
    switch (webhookEvent.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handlePayPalSubscriptionActivated(webhookEvent.resource);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handlePayPalSubscriptionCancelled(webhookEvent.resource);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handlePayPalSubscriptionExpired(webhookEvent.resource);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePayPalPaymentCompleted(webhookEvent.resource);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${webhookEvent.event_type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handle PayPal subscription activated
async function handlePayPalSubscriptionActivated(resource) {
  try {
    console.log('✅ PayPal subscription activated:', resource.id);

    const userSubscription = await UserSubscription.findOne({
      paypal_subscription_id: resource.id
    });

    if (userSubscription) {
      userSubscription.status = 'active';
      await userSubscription.save();
    }

  } catch (error) {
    console.error('Error handling PayPal subscription activation:', error);
  }
}

// Handle PayPal subscription cancelled
async function handlePayPalSubscriptionCancelled(resource) {
  try {
    console.log('🗑️  PayPal subscription cancelled:', resource.id);

    const userSubscription = await UserSubscription.findOne({
      paypal_subscription_id: resource.id
    });

    if (userSubscription) {
      userSubscription.status = 'cancelled';
      userSubscription.cancelled_at = new Date();
      await userSubscription.save();
    }

  } catch (error) {
    console.error('Error handling PayPal subscription cancellation:', error);
  }
}

// Handle PayPal subscription expired
async function handlePayPalSubscriptionExpired(resource) {
  try {
    console.log('⏰ PayPal subscription expired:', resource.id);

    const userSubscription = await UserSubscription.findOne({
      paypal_subscription_id: resource.id
    });

    if (userSubscription) {
      userSubscription.status = 'expired';
      await userSubscription.save();
    }

  } catch (error) {
    console.error('Error handling PayPal subscription expiration:', error);
  }
}

// Handle PayPal payment completed
async function handlePayPalPaymentCompleted(resource) {
  try {
    console.log('💰 PayPal payment completed:', resource.id);

    // Find subscription by billing agreement ID
    const billingAgreementId = resource.billing_agreement_id;
    
    const userSubscription = await UserSubscription.findOne({
      paypal_subscription_id: billingAgreementId
    }).populate('subscription_id');

    if (!userSubscription) {
      console.error('User subscription not found for PayPal billing agreement:', billingAgreementId);
      return;
    }

    // Add coins to user account
    const coinsToAdd = userSubscription.subscription_id.coins_per_month;
    await User.findByIdAndUpdate(userSubscription.user_id, {
      $inc: { coins: coinsToAdd }
    });

    // Create transaction record
    const transaction = new SubscriptionTransaction({
      user_subscription_id: userSubscription._id,
      user_id: userSubscription.user_id,
      amount: parseFloat(resource.amount.total),
      currency: resource.amount.currency,
      payment_method: 'paypal',
      status: 'completed',
      paypal_order_id: resource.id,
      coins_awarded: coinsToAdd
    });

    await transaction.save();
    console.log(`✅ Added ${coinsToAdd} coins to user ${userSubscription.user_id}`);

  } catch (error) {
    console.error('Error handling PayPal payment:', error);
  }
}

