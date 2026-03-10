import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middlware';
import * as paymentService from '../service/payment.service';
import { constructStripeEvent } from '../service/stripe.service';
import {
  InitiatePaymentInput,
  CapturePayPalInput,
  PaymentQueryInput,
} from '../validation/payment.validation';

// ── POST /api/payments/initiate ───────────────────────────────────────────────
export const initiatePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payment = await paymentService.initiatePayment(
      req.body as InitiatePaymentInput,
      req.userId!,
      req.userEmail!,
    );
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/payments ─────────────────────────────────────────────────────────
export const getPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await paymentService.getUserPayments(
      req.query as unknown as PaymentQueryInput,
      req.userId!,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/payments/order/:orderId ──────────────────────────────────────────
export const getPaymentByOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payment = await paymentService.getPaymentByOrder(
      req.params.orderId,
      req.userId!,
    );
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/paypal/capture ─────────────────────────────────────────
export const capturePayPal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payment = await paymentService.capturePayPal(
      req.body as CapturePayPalInput,
      req.userId!,
      req.userEmail!,
    );
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/stripe/webhook ────────────────────────────────────────
// ⚠️  raw body — registered with express.raw() in router
export const stripeWebhook = async (
  req: any,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const event = constructStripeEvent(req.body, sig);

    await paymentService.handleStripeWebhook(
      (event.data.object as any).id,
      event.type,
    );

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
