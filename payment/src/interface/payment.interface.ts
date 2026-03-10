import { Document } from 'mongoose';

export type PaymentProvider = 'stripe' | 'paypal' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IPayment extends Document {
  orderId: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;

  // ── Stripe ────────────────────────────────────────────────────────────────
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;

  // ── PayPal ────────────────────────────────────────────────────────────────
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalApproveUrl?: string;

  // ── Refund ────────────────────────────────────────────────────────────────
  refundId?: string;
  refundedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
