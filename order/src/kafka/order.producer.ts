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

// ── Order placed ──────────────────────────────────────────────────────────────
export const sendOrderPlaced = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  total: number;
  items: { name: string; quantity: number }[];
}): void => {
  safeSend(() =>
    producer.send({
      topic: 'order-placed',
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
            subject: '✅ Order Placed!',
            body: `Your order #${data.orderId} has been placed. Total: $${data.total}`,
          }),
        },
      ],
    }),
  );
};

// ── Order status updated ──────────────────────────────────────────────────────
export const sendOrderStatusUpdated = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  status: string;
}): void => {
  safeSend(() =>
    producer.send({
      topic: 'order-status-updated',
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
            subject: `📦 Order Update: ${data.status}`,
            body: `Your order #${data.orderId} is now: ${data.status}`,
          }),
        },
      ],
    }),
  );
};

// ── Request payment (tells payment service to initiate) ───────────────────────
export const sendPaymentRequested = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
}): void => {
  safeSend(() =>
    producer.send({
      topic: 'payment-requested',
      messages: [{ value: JSON.stringify(data) }],
    }),
  );
};
