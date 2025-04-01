const Razorpay = require('razorpay');
const Order = require('../models/orderModel');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const verifyOrder = async (req, res) => {
  const { orderId } = req.body

  try {
    const order = await Order.findById(orderId)
  
    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order doesn't exist"
      })
    }
  
    const razorPayOrderId = order.paymentInfo.id
  
    const rzOrder = await razorpay.orders.fetch(razorPayOrderId)
    
    if (rzOrder.status === "paid") {
      await Order.findByIdAndUpdate(orderId, {
        "paymentInfo.status": "paid"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        attempts: rzOrder.attempts,
        status: rzOrder.status
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

const createPaymentIntent = async (req, res) => {
  const { cart, totalPrice } = req.body;

  try {
    const options = {
      amount: totalPrice, //in paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { cart },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  verifyOrder,
  createPaymentIntent
};