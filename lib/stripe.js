const Stripe = require('stripe');

let _stripe = null;

/**
 * @returns {Stripe} Stripe instance
 */
module.exports = () => {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // ...
    });
  }
  return _stripe;
};
