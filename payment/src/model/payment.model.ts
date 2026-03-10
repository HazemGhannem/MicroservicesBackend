import mongoose, { Schema } from 'mongoose';
import { IPayment } from '../interface/payment.interface';

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },

    provider: {
      type: String,
      enum: ['stripe', 'paypal', 'cash_on_delivery'],
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    // ── Stripe ──────────────────────────────────────────────────────────────
    stripePaymentIntentId: { type: String },
    stripeClientSecret: { type: String },

    // ── PayPal ──────────────────────────────────────────────────────────────
    paypalOrderId: { type: String },
    paypalCaptureId: { type: String },
    paypalApproveUrl: { type: String },

    // ── Refund ──────────────────────────────────────────────────────────────
    refundId: { type: String },
    refundedAt: { type: Date },
  },
  { timestamps: true },
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
