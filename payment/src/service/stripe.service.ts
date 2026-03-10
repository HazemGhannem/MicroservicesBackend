import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '../db/env';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// ── Create payment intent ─────────────────────────────────────────────────────
export const createStripePaymentIntent = async (
  amount: number,
  orderId: string,
  userEmail: string,
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    metadata: { orderId, userEmail },
    automatic_payment_methods: { enabled: true },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
};

// ── Verify webhook signature ──────────────────────────────────────────────────
export const constructStripeEvent = (payload: Buffer, signature: string) => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_WEBHOOK_SECRET,
  );
};

// ── Refund ────────────────────────────────────────────────────────────────────
export const refundStripePayment = async (paymentIntentId: string) => {
  return stripe.refunds.create({ payment_intent: paymentIntentId });
};
