const paypal = require('@paypal/checkout-server-sdk');

// Create PayPal environment
const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (process.env.PAYPAL_MODE === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
};

// Create PayPal client
const client = () => {
  return new paypal.core.PayPalHttpClient(environment());
};

module.exports = { client };

