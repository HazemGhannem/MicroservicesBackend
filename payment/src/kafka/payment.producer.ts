import { logger } from '../utils/logger';
import { producer } from './config';
const safeSend = (fn: () => Promise<unknown>): void => {
  Promise.race([
    fn(),
    new Promise<unknown>((_, reject) =>
      setTimeout(() => reject(new Error('Kafka timeout')), 3000),
    ),
  ]).catch((err) => logger.error({ err }, 'Kafka send failed'));
};
// ── Payment success → order service updates order ─────────────────────────────
export const sendPaymentSuccess = (data: {
  orderId: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
}): void => {
  safeSend(() =>
    producer.send({
      topic: 'payment-success',
      messages: [{ value: JSON.stringify(data) }],
    }),
  );
  safeSend(() =>
    producer.send({
      topic: 'email-topic',
      messages: [
        {
          value: JSON.stringify({
            to: data.userEmail,
            subject: '✅ Payment Successful',
            body: `Payment of $${data.amount} for order #${data.orderId} was successful. payment methode: ${data.paymentMethod}`,
          }),
        },
      ],
    }),
  );
};

// ── Payment failed ────────────────────────────────────────────────────────────
export const sendPaymentFailed = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
}): void => {
  safeSend(() =>
    producer.send({
      topic: 'payment-failed',
      messages: [{ value: JSON.stringify(data) }],
    }),
  );
  safeSend(() =>
    producer.send({
      topic: 'email-topic',
      messages: [
        {
          value: JSON.stringify({
            to: data.userEmail,
            subject: '❌ Payment Failed',
            body: `Payment for order #${data.orderId} failed.`,
          }),
        },
      ],
    }),
  );
};

// ── Refund processed ──────────────────────────────────────────────────────────
export const sendRefundProcessed = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  amount: number;
}): void => {
  safeSend(() =>
    producer.send({
      topic: 'refund-processed',
      messages: [{ value: JSON.stringify(data) }],
    }),
  );
  safeSend(() =>
    producer.send({
      topic: 'email-topic',
      messages: [
        {
          value: JSON.stringify({
            to: data.userEmail,
            subject: '💰 Refund Processed',
            body: `Refund of $${data.amount} for order #${data.orderId} processed.`,
          }),
        },
      ],
    }),
  );
};
