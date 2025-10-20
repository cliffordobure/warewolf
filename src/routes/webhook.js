const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Stripe webhook - receives raw body for signature verification
router.post(
  '/stripe',
  webhookController.handleStripeWebhook
);

// PayPal webhook
router.post(
  '/paypal',
  webhookController.handlePayPalWebhook
);

module.exports = router;

