import { Router } from 'express';
import express from 'express';
import * as paymentController from '../controller/payment.controller';
import { authMiddleware } from '../middleware/auth.middlware';
import { validate } from '../middleware/validate.middleware';
import {
  initiatePaymentSchema,
  capturePayPalSchema,
  paymentQuerySchema,
} from '../validation/payment.validation';

const router = Router();

// ── Stripe webhook — raw body MUST be before express.json() ──────────────────
router.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook,
);

// ── PayPal capture ────────────────────────────────────────────────────────────
router.post(
  '/paypal/capture',
  authMiddleware,
  validate(capturePayPalSchema),
  paymentController.capturePayPal,
);

// ── Initiate payment (HTTP fallback) ──────────────────────────────────────────
router.post(
  '/initiate',
  authMiddleware,
  validate(initiatePaymentSchema),
  paymentController.initiatePayment,
);

// ── Get my payments ───────────────────────────────────────────────────────────
router.get(
  '/',
  authMiddleware,
  validate(paymentQuerySchema, 'query'),
  paymentController.getPayments,
);

// ── Get payment by order ──────────────────────────────────────────────────────
router.get(
  '/order/:orderId',
  authMiddleware,
  paymentController.getPaymentByOrder,
);

export default router;
