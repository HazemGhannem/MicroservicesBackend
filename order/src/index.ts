import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import orderRouter from './routers/order.router';
import { errorHandler } from './middleware/error.middleware';
import { producer } from './kafka/config';
import { startOrderConsumer, stopOrderConsumer } from './kafka/order.producer';
import connectDB from './db/db';
import { PORT } from './db/env';
import { logger } from './utils/logger';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/orders', orderRouter);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();
  await producer.connect();
  await startOrderConsumer();

  logger.info('✅ Kafka producer + consumer connected');

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    logger.info(`✅ Order service running on port ${PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await stopOrderConsumer();
      await producer.disconnect();
      await mongoose.disconnect();
      logger.info('✅ Disconnected cleanly');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, '❌ Bootstrap failed');
  process.exit(1);
});
