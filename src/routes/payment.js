const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const stripeIntentValidation = [
  body('item_id')
    .notEmpty()
    .withMessage('Item ID is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP', 'CNY'])
    .withMessage('Invalid currency')
];

const stripeConfirmValidation = [
  body('payment_intent_id')
    .notEmpty()
    .withMessage('Payment intent ID is required')
];

const paypalOrderValidation = [
  body('item_id')
    .notEmpty()
    .withMessage('Item ID is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP', 'CNY'])
    .withMessage('Invalid currency')
];

const paypalCaptureValidation = [
  body('order_id')
    .notEmpty()
    .withMessage('Order ID is required')
];

// Routes
router.post('/stripe/create-intent', stripeIntentValidation, validate, paymentController.createStripeIntent);
router.post('/stripe/confirm', stripeConfirmValidation, validate, paymentController.confirmStripePayment);

router.post('/paypal/create-order', paypalOrderValidation, validate, paymentController.createPayPalOrder);
router.post('/paypal/capture', paypalCaptureValidation, validate, paymentController.capturePayPalPayment);

router.get('/transactions', paymentController.getTransactions);

module.exports = router;

