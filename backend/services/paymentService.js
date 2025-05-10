const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

class PaymentService {
  // Create a Stripe customer for a user
  static async createCustomer(userId, email) {
    try {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId
        }
      });

      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(userId, {
        stripeCustomerId: customer.id
      });

      return customer;
    } catch (error) {
      throw new Error(`Error creating Stripe customer: ${error.message}`);
    }
  }

  // Create a subscription for a user
  static async createSubscription(userId, priceId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(userId, user.email);
        customerId = customer.id;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      throw new Error(`Error creating subscription: ${error.message}`);
    }
  }

  // Cancel a subscription
  static async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.del(subscriptionId);
      return subscription;
    } catch (error) {
      throw new Error(`Error canceling subscription: ${error.message}`);
    }
  }

  // Get subscription status
  static async getSubscriptionStatus(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      throw new Error(`Error getting subscription status: ${error.message}`);
    }
  }

  // Create a payment intent for one-time payments
  static async createPaymentIntent(userId, amount, currency = 'usd') {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(userId, user.email);
        customerId = customer.id;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      throw new Error(`Error creating payment intent: ${error.message}`);
    }
  }

  // Handle webhook events
  static async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionChange(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeletion(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      throw new Error(`Error handling webhook: ${error.message}`);
    }
  }

  // Handle subscription changes
  static async handleSubscriptionChange(subscription) {
    const userId = subscription.metadata.userId;
    const status = subscription.status;

    await User.findByIdAndUpdate(userId, {
      subscription: status === 'active' ? 'premium' : 'free'
    });
  }

  // Handle subscription deletion
  static async handleSubscriptionDeletion(subscription) {
    const userId = subscription.metadata.userId;
    await User.findByIdAndUpdate(userId, {
      subscription: 'free'
    });
  }

  // Handle successful payment
  static async handleSuccessfulPayment(paymentIntent) {
    // Implement any necessary logic for successful payments
    console.log('Payment successful:', paymentIntent.id);
  }
}

module.exports = PaymentService; 