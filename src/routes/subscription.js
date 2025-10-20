const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const authenticate = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();

// Public route to get all subscriptions
router.get(
  '/',
  subscriptionController.getSubscriptions
);

// All routes below require authentication
router.use(authenticate);

// Get user's subscriptions
router.get(
  '/user',
  subscriptionController.getUserSubscriptions
);

// Get user's subscription transactions
router.get(
  '/transactions',
  subscriptionController.getSubscriptionTransactions
);

// Create Stripe subscription
router.post(
  '/create/stripe',
  [
    body('subscription_id')
      .notEmpty()
      .withMessage('Subscription ID is required')
      .isMongoId()
      .withMessage('Invalid subscription ID'),
    body('currency')
      .optional()
      .isIn(['usd', 'eur', 'gbp', 'cny'])
      .withMessage('Invalid currency'),
    validate
  ],
  subscriptionController.createStripeSubscription
);

// Create PayPal subscription (initial request)
router.post(
  '/create/paypal',
  [
    body('subscription_id')
      .notEmpty()
      .withMessage('Subscription ID is required')
      .isMongoId()
      .withMessage('Invalid subscription ID'),
    validate
  ],
  subscriptionController.createPayPalSubscription
);

// Confirm PayPal subscription (after user approval)
router.post(
  '/confirm/paypal',
  [
    body('subscription_id')
      .notEmpty()
      .withMessage('Subscription ID is required')
      .isMongoId()
      .withMessage('Invalid subscription ID'),
    body('paypal_subscription_id')
      .notEmpty()
      .withMessage('PayPal subscription ID is required'),
    validate
  ],
  subscriptionController.confirmPayPalSubscription
);

// Cancel subscription
router.post(
  '/:subscriptionId/cancel',
  [
    param('subscriptionId')
      .isMongoId()
      .withMessage('Invalid subscription ID'),
    validate
  ],
  subscriptionController.cancelSubscription
);

module.exports = router;

