import { Order } from '../model/order.model';
import { logger } from '../utils/logger';
import { sendOrderStatusUpdated } from './order.producer';
import { consumer } from './config';

export const startOrderConsumer = async (): Promise<void> => {
  await consumer.connect();

  // ── Listen for payment results from payment-service ──────────────────────
  await consumer.subscribe({
    topics: ['payment-success', 'payment-failed'],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const data = JSON.parse(message.value?.toString() || '{}');

        if (topic === 'payment-success') {
          await Order.findByIdAndUpdate(data.orderId, {
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentId: data.paymentId,
          });

          sendOrderStatusUpdated({
            orderId: data.orderId,
            userId: data.userId,
            userEmail: data.userEmail,
            status: 'confirmed',
          });

          logger.info(
            { orderId: data.orderId },
            'Order confirmed after payment',
          );
        }

        if (topic === 'payment-failed') {
          await Order.findByIdAndUpdate(data.orderId, {
            paymentStatus: 'failed',
          });
          logger.warn({ orderId: data.orderId }, 'Payment failed for order');
        }
      } catch (err) {
        logger.error({ err, topic }, 'Error processing payment event');
      }
    },
  });

  logger.info('✅ Order consumer started');
};

export const stopOrderConsumer = async (): Promise<void> => {
  await consumer.disconnect();
};
