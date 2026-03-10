import { producer } from './config';

// ── Order placed ──────────────────────────────────────────────────────────────
export const sendOrderPlaced = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  total: number;
  items: { name: string; quantity: number }[];
}): void => {
  producer.send({
    topic: 'order-placed',
    messages: [{ value: JSON.stringify(data) }],
  });
  // Confirmation email
  producer.send({
    topic: 'email-topic',
    messages: [
      {
        value: JSON.stringify({
          to: data.userEmail,
          subject: '✅ Order Confirmed!',
          body: `Your order #${data.orderId} has been placed. Total: $${data.total}`,
        }),
      },
    ],
  });
};

// ── Order status updated ──────────────────────────────────────────────────────
export const sendOrderStatusUpdated = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  status: string;
}): void => {
  producer.send({
    topic: 'order-status-updated',
    messages: [{ value: JSON.stringify(data) }],
  });

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
  });
};

// ── Request payment (tells payment service to initiate) ───────────────────────
export const sendPaymentRequested = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
}): void => {
  producer.send({
    topic: 'payment-requested',
    messages: [{ value: JSON.stringify(data) }],
  });
};
