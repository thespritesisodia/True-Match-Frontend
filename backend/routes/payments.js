const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PaymentService = require('../services/paymentService');

// Create a subscription
router.post('/subscription', auth, async (req, res) => {
  try {
    const { priceId } = req.body;
    const subscription = await PaymentService.createSubscription(req.user.id, priceId);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel a subscription
router.delete('/subscription/:subscriptionId', auth, async (req, res) => {
  try {
    const subscription = await PaymentService.cancelSubscription(req.params.subscriptionId);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subscription status
router.get('/subscription/:subscriptionId', auth, async (req, res) => {
  try {
    const subscription = await PaymentService.getSubscriptionStatus(req.params.subscriptionId);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a payment intent for one-time payment
router.post('/payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const paymentIntent = await PaymentService.createPaymentIntent(req.user.id, amount, currency);
    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await PaymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.stripeCustomerId) {
      return res.json([]);
    }

    const paymentIntents = await stripe.paymentIntents.list({
      customer: user.stripeCustomerId
    });

    res.json(paymentIntents.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 