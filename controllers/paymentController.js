const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const calculateOrderAmount = (shipping_fee, total_amount) => {
  return shipping_fee + total_amount;
};

const paymentController = async (req, res) => {
  const { cart, shipping_fee, total_amount, shipping } = req.body;

  try {
    const options = {
      amount: calculateOrderAmount(shipping_fee, total_amount) * 100, // Convert to paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { shipping },
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = paymentController;