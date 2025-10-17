const stripe = require('../config/stripe');
const { client: paypalClient } = require('../config/paypal');
const paypal = require('@paypal/checkout-server-sdk');
const ShopItem = require('../models/ShopItem');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ApiResponse = require('../utils/response');

// Stripe: Create payment intent
exports.createStripeIntent = async (req, res, next) => {
  try {
    const { item_id, amount, currency } = req.body;

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CNY'];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      return ApiResponse.error(
        res,
        'Invalid currency',
        'INVALID_CURRENCY',
        400
      );
    }

    // Get shop item
    const item = await ShopItem.findById(item_id);
    if (!item || !item.is_active) {
      return ApiResponse.error(res, 'Item not found', 'ITEM_NOT_FOUND', 404);
    }

    // Verify amount matches item price
    const currencyKey = `price_${currency.toLowerCase()}`;
    const expectedAmount = item[currencyKey];
    
    if (!expectedAmount || Math.abs(amount - expectedAmount) > 0.01) {
      return ApiResponse.error(
        res,
        'Invalid amount',
        'INVALID_AMOUNT',
        400
      );
    }

    // Create transaction record
    const transaction = new Transaction({
      user_id: req.userId,
      item_id: item._id,
      item_name: item.name,
      coins: item.coins,
      amount,
      currency: currency.toUpperCase(),
      payment_method: 'stripe',
      status: 'pending'
    });

    await transaction.save();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        transaction_id: transaction._id.toString(),
        user_id: req.userId.toString(),
        item_id: item._id.toString(),
        coins: item.coins.toString()
      }
    });

    // Update transaction with payment intent ID
    transaction.payment_intent_id = paymentIntent.id;
    await transaction.save();

    return ApiResponse.success(
      res,
      {
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      },
      'Payment intent created successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Stripe: Confirm payment
exports.confirmStripePayment = async (req, res, next) => {
  try {
    const { payment_intent_id } = req.body;

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (!paymentIntent) {
      return ApiResponse.error(
        res,
        'Payment intent not found',
        'PAYMENT_NOT_FOUND',
        404
      );
    }

    // Find transaction
    const transaction = await Transaction.findOne({ payment_intent_id });
    
    if (!transaction) {
      return ApiResponse.error(
        res,
        'Transaction not found',
        'TRANSACTION_NOT_FOUND',
        404
      );
    }

    // Check if payment succeeded
    if (paymentIntent.status === 'succeeded') {
      // Update transaction
      transaction.status = 'completed';
      transaction.transaction_id = paymentIntent.latest_charge || paymentIntent.id;
      
      if (paymentIntent.charges && paymentIntent.charges.data[0]) {
        transaction.receipt_url = paymentIntent.charges.data[0].receipt_url;
      }
      
      await transaction.save();

      // Update user coins
      const user = await User.findById(transaction.user_id);
      user.coins += transaction.coins;
      await user.save();

      return ApiResponse.success(
        res,
        {
          transaction: {
            id: transaction._id,
            user_id: transaction.user_id,
            item_id: transaction.item_id,
            item_name: transaction.item_name,
            coins: transaction.coins,
            amount: transaction.amount,
            currency: transaction.currency,
            payment_method: transaction.payment_method,
            status: transaction.status,
            transaction_id: transaction.transaction_id,
            payment_intent_id: transaction.payment_intent_id,
            receipt_url: transaction.receipt_url,
            created_at: transaction.created_at
          },
          user_coins: user.coins
        },
        'Payment completed successfully'
      );
    } else {
      // Payment failed or requires action
      transaction.status = 'failed';
      transaction.error_message = `Payment status: ${paymentIntent.status}`;
      await transaction.save();

      return ApiResponse.error(
        res,
        `Payment ${paymentIntent.status}`,
        'PAYMENT_FAILED',
        400
      );
    }
  } catch (error) {
    next(error);
  }
};

// PayPal: Create order
exports.createPayPalOrder = async (req, res, next) => {
  try {
    const { item_id, amount, currency } = req.body;

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CNY'];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      return ApiResponse.error(
        res,
        'Invalid currency',
        'INVALID_CURRENCY',
        400
      );
    }

    // Get shop item
    const item = await ShopItem.findById(item_id);
    if (!item || !item.is_active) {
      return ApiResponse.error(res, 'Item not found', 'ITEM_NOT_FOUND', 404);
    }

    // Verify amount
    const currencyKey = `price_${currency.toLowerCase()}`;
    const expectedAmount = item[currencyKey];
    
    if (!expectedAmount || Math.abs(amount - expectedAmount) > 0.01) {
      return ApiResponse.error(
        res,
        'Invalid amount',
        'INVALID_AMOUNT',
        400
      );
    }

    // Create transaction record
    const transaction = new Transaction({
      user_id: req.userId,
      item_id: item._id,
      item_name: item.name,
      coins: item.coins,
      amount,
      currency: currency.toUpperCase(),
      payment_method: 'paypal',
      status: 'pending'
    });

    await transaction.save();

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2)
        },
        description: item.name,
        custom_id: transaction._id.toString()
      }],
      application_context: {
        return_url: `${process.env.CORS_ORIGIN}/payment/success`,
        cancel_url: `${process.env.CORS_ORIGIN}/payment/cancel`,
        brand_name: 'Werewolf Kill Game',
        user_action: 'PAY_NOW'
      }
    });

    const order = await paypalClient().execute(request);

    // Update transaction with order ID
    transaction.order_id = order.result.id;
    await transaction.save();

    // Get approval URL
    const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;

    return ApiResponse.success(
      res,
      {
        order_id: order.result.id,
        approval_url: approvalUrl,
        amount,
        currency: currency.toUpperCase()
      },
      'PayPal order created successfully'
    );
  } catch (error) {
    console.error('PayPal order creation error:', error);
    next(error);
  }
};

// PayPal: Capture payment
exports.capturePayPalPayment = async (req, res, next) => {
  try {
    const { order_id } = req.body;

    // Find transaction
    const transaction = await Transaction.findOne({ order_id });
    
    if (!transaction) {
      return ApiResponse.error(
        res,
        'Transaction not found',
        'TRANSACTION_NOT_FOUND',
        404
      );
    }

    // Capture PayPal order
    const request = new paypal.orders.OrdersCaptureRequest(order_id);
    request.requestBody({});

    const capture = await paypalClient().execute(request);

    if (capture.result.status === 'COMPLETED') {
      // Update transaction
      transaction.status = 'completed';
      transaction.transaction_id = capture.result.purchase_units[0].payments.captures[0].id;
      
      if (capture.result.payer) {
        transaction.payer_email = capture.result.payer.email_address;
        transaction.payer_name = capture.result.payer.name ? 
          `${capture.result.payer.name.given_name} ${capture.result.payer.name.surname}` : null;
      }
      
      await transaction.save();

      // Update user coins
      const user = await User.findById(transaction.user_id);
      user.coins += transaction.coins;
      await user.save();

      return ApiResponse.success(
        res,
        {
          transaction: {
            id: transaction._id,
            user_id: transaction.user_id,
            item_id: transaction.item_id,
            item_name: transaction.item_name,
            coins: transaction.coins,
            amount: transaction.amount,
            currency: transaction.currency,
            payment_method: transaction.payment_method,
            status: transaction.status,
            transaction_id: transaction.transaction_id,
            order_id: transaction.order_id,
            payer_email: transaction.payer_email,
            payer_name: transaction.payer_name,
            created_at: transaction.created_at
          },
          user_coins: user.coins
        },
        'Payment completed successfully'
      );
    } else {
      transaction.status = 'failed';
      transaction.error_message = `Order status: ${capture.result.status}`;
      await transaction.save();

      return ApiResponse.error(
        res,
        `Payment ${capture.result.status}`,
        'PAYMENT_FAILED',
        400
      );
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    next(error);
  }
};

// Get transaction history
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user_id: req.userId };
    
    if (status) {
      filter.status = status;
    }

    const transactions = await Transaction.find(filter)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(filter);

    const transactionsResponse = transactions.map(t => ({
      id: t._id,
      item_name: t.item_name,
      coins: t.coins,
      amount: t.amount,
      currency: t.currency,
      payment_method: t.payment_method,
      status: t.status,
      transaction_id: t.transaction_id,
      receipt_url: t.receipt_url,
      created_at: t.created_at
    }));

    return ApiResponse.paginated(
      res,
      transactionsResponse,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1
      },
      'Transactions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

