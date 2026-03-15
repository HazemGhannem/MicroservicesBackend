import { Payment } from '../model/payment.model';
import { createStripePaymentIntent } from '../service/stripe.service';
import { createPayPalOrder } from '../service/paypal.service';
import { sendRefundProcessed } from './payment.producer';
import { refundStripePayment } from '../service/stripe.service';
import { refundPayPalPayment } from '../service/paypal.service';
import { logger } from '../utils/logger';
import { consumer } from './config';

export const startPaymentConsumer = async (): Promise<void> => {
  await consumer.connect();

  await consumer.subscribe({
    topics: ['payment-requested', 'refund-requested'],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const data = JSON.parse(message.value?.toString() || '{}');

        // ── Payment requested by order service ──────────────────────────────
        if (topic === 'payment-requested') {
          const payment = await Payment.create({
            orderId: data.orderId,
            userId: data.userId,
            userEmail: data.userEmail,
            amount: data.amount,
            provider: data.paymentMethod,
            status: 'pending',
          });

          if (data.paymentMethod === 'stripe') {
            const { clientSecret, paymentIntentId } =
              await createStripePaymentIntent(
                data.amount,
                data.orderId,
                data.userEmail,
              );
            await Payment.findByIdAndUpdate(payment._id, {
              stripePaymentIntentId: paymentIntentId,
              stripeClientSecret: clientSecret,
            });
          }

          if (data.paymentMethod === 'paypal') {
            const { paypalOrderId, approveUrl } = await createPayPalOrder(
              data.amount,
              data.orderId,
            );
            await Payment.findByIdAndUpdate(payment._id, {
              paypalOrderId,
              paypalApproveUrl: approveUrl,
            });
          }

          logger.info(
            { orderId: data.orderId, provider: data.paymentMethod },
            'Payment initiated',
          );
        }

        // ── Refund requested by order service ───────────────────────────────
        if (topic === 'refund-requested') {
          const payment = await Payment.findById(data.paymentId);
          if (!payment) return;

          let refundId = '';

          if (payment.provider === 'stripe' && payment.stripePaymentIntentId) {
            const refund = await refundStripePayment(
              payment.stripePaymentIntentId,
            );
            refundId = refund.id;
          }

          if (payment.provider === 'paypal' && payment.paypalCaptureId) {
            const refund = await refundPayPalPayment(
              payment.paypalCaptureId,
              payment.amount,
            );
            refundId = refund.id;
          }

          await Payment.findByIdAndUpdate(payment._id, {
            status: 'refunded',
            refundId,
            refundedAt: new Date(),
          });

          sendRefundProcessed({
            orderId: data.orderId,
            userId: data.userId,
            userEmail: data.userEmail,
            amount: payment.amount,
          });

          logger.info({ orderId: data.orderId }, 'Refund processed');
        }
      } catch (err) {
        logger.error({ err, topic }, 'Error processing payment event');
      }
    },
  });

  logger.info('✅ Payment consumer started');
};

export const stopPaymentConsumer = async (): Promise<void> => {
  await consumer.disconnect();
};
