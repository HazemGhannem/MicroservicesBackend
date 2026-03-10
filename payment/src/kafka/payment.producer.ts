import { producer } from './config';
 
// ── Payment success → order service updates order ─────────────────────────────
export const sendPaymentSuccess = (data: {
  orderId: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
}): void => {
  producer.send({
    topic: 'payment-success',
    messages: [{ value: JSON.stringify(data) }],
  });

  producer.send({
    topic: 'email-topic',
    messages: [
      {
        value: JSON.stringify({
          to: data.userEmail,
          subject: '✅ Payment Successful',
          body: `Your payment of $${data.amount} for order #${data.orderId} was successful.`,
        }),
      },
    ],
  });
};

// ── Payment failed ────────────────────────────────────────────────────────────
export const sendPaymentFailed = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
}): void => {
  producer.send({
    topic: 'payment-failed',
    messages: [{ value: JSON.stringify(data) }],
  });

  producer.send({
    topic: 'email-topic',
    messages: [
      {
        value: JSON.stringify({
          to: data.userEmail,
          subject: '❌ Payment Failed',
          body: `Your payment for order #${data.orderId} failed. Please try again.`,
        }),
      },
    ],
  });
};

// ── Refund processed ──────────────────────────────────────────────────────────
export const sendRefundProcessed = (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  amount: number;
}): void => {
  producer.send({
    topic: 'refund-processed',
    messages: [{ value: JSON.stringify(data) }],
  });

  producer.send({
    topic: 'email-topic',
    messages: [
      {
        value: JSON.stringify({
          to: data.userEmail,
          subject: '💰 Refund Processed',
          body: `Your refund of $${data.amount} for order #${data.orderId} has been processed.`,
        }),
      },
    ],
  });
};
