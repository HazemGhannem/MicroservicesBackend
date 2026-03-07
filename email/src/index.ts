import { EachMessagePayload } from 'kafkajs';
import { consumer, producer } from './kafka/config';
import { createTransport, getTestMessageUrl } from 'nodemailer';
import { logger } from './utils/logger';
import { GMAIL_APP_PASSWORD, GMAIL_USER } from './utils/env';

async function run() {
  // ── Create transporter once ───────────────────────────────────────────────
  const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  // ── Connect Kafka once ────────────────────────────────────────────────────
  await producer.connect();
  logger.info('Kafka producer connected');

  await consumer.connect();

  // ── Subscribe to both topics ──────────────────────────────────────────────

  await consumer.subscribe({
    topics: ['email-topic', 'user-created'],
    fromBeginning: false,
  });
  logger.info('Kafka consumer subscribed to email-topic, user-created');

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      if (!message.value) {
        logger.warn({ topic }, 'Received empty message, skipping');
        return;
      }

      try {
        const { to, subject, body } = JSON.parse(message.value.toString());

        logger.debug({ topic, to, subject }, 'Processing email');

        const info = await transporter.sendMail({
          from: GMAIL_USER,
          to,
          subject,
          html: `<h1>${body}</h1>`,
        });

        logger.info({ to, preview: getTestMessageUrl(info) }, 'Email sent');
      } catch (err) {
        logger.error({ err, topic }, 'Failed to send email');
        // ✅ don't rethrow — bad message won't crash the consumer
      }
    },
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received — shutting down`);
    await consumer.disconnect();
    await producer.disconnect();
    transporter.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

run().catch((err) => {
  logger.error({ err }, 'Email service failed to start');
  process.exit(1);
});
