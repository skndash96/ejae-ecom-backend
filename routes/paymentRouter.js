const router = require('express').Router();

const paymentController = require('../controllers/paymentController');

router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/verify', paymentController.verifyOrder)

module.exports = router;
