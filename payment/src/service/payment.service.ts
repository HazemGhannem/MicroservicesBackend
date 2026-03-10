import { Payment } from '../model/payment.model';
import { AppError } from '../middleware/error.middleware';
import {
  CapturePayPalInput,
  InitiatePaymentInput,
  PaymentQueryInput,
} from '../validation/payment.validation';
import { capturePayPalPayment } from './paypal.service';
import {
  sendPaymentSuccess,
  sendPaymentFailed,
} from '../kafka/payment.producer';

// ── Initiate payment (HTTP fallback — normally triggered via Kafka) ────────────
export const initiatePayment = async (
  data: InitiatePaymentInput,
  userId: string,
  userEmail: string,
) => {
  const existing = await Payment.findOne({
    orderId: data.orderId,
    status: { $in: ['pending', 'paid'] },
  });
  if (existing) return existing;

  const payment = await Payment.create({
    orderId: data.orderId,
    userId,
    userEmail,
    provider: data.paymentMethod,
    amount: 0, // amount is set via Kafka flow
    status: 'pending',
  });

  return payment;
};

// ── Get payment by order ──────────────────────────────────────────────────────
export const getPaymentByOrder = async (orderId: string, userId: string) => {
  const payment = await Payment.findOne({ orderId }).lean();
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.userId !== userId) throw new AppError('Not authorized', 403);
  return payment;
};

// ── Get user payments ─────────────────────────────────────────────────────────
export const getUserPayments = async (
  query: PaymentQueryInput,
  userId: string,
) => {
  const { page, pageSize, status, sortOrder } = query;
  const filter: Record<string, any> = { userId };
  if (status) filter.status = status;

  const skip = (page - 1) * pageSize;
  const sort = { createdAt: sortOrder === 'asc' ? 1 : -1 } as const;

  const [payments, total] = await Promise.all([
    Payment.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page < Math.ceil(total / pageSize),
      hasPrev: page > 1,
    },
  };
};

// ── Capture PayPal (user returns from PayPal approval page) ───────────────────
export const capturePayPal = async (
  data: CapturePayPalInput,
  userId: string,
  userEmail: string,
) => {
  const payment = await Payment.findOne({ orderId: data.orderId, userId });
  if (!payment) throw new AppError('Payment not found', 404);

  if (payment.status === 'paid') return payment; // idempotent

  const { status, captureId } = await capturePayPalPayment(data.paypalOrderId);

  if (status === 'COMPLETED') {
    const updated = await Payment.findByIdAndUpdate(
      payment._id,
      { status: 'paid', paypalCaptureId: captureId },
      { new: true },
    );

    sendPaymentSuccess({
      orderId: data.orderId,
      paymentId: payment._id.toString(),
      userId,
      userEmail,
      amount: payment.amount,
      paymentMethod: 'paypal',
    });

    return updated;
  }

  await Payment.findByIdAndUpdate(payment._id, { status: 'failed' });
  sendPaymentFailed({ orderId: data.orderId, userId, userEmail });
  throw new AppError('PayPal capture failed', 400);
};

// ── Stripe webhook — confirm or fail payment ──────────────────────────────────
export const handleStripeWebhook = async (
  paymentIntentId: string,
  eventType: string,
) => {
  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntentId,
  });
  if (!payment) return;

  if (eventType === 'payment_intent.succeeded') {
    await Payment.findByIdAndUpdate(payment._id, { status: 'paid' });

    sendPaymentSuccess({
      orderId: payment.orderId,
      paymentId: payment._id.toString(),
      userId: payment.userId,
      userEmail: payment.userEmail,
      amount: payment.amount,
      paymentMethod: 'stripe',
    });
  }

  if (eventType === 'payment_intent.payment_failed') {
    await Payment.findByIdAndUpdate(payment._id, { status: 'failed' });
    sendPaymentFailed({
      orderId: payment.orderId,
      userId: payment.userId,
      userEmail: payment.userEmail,
    });
  }
};
