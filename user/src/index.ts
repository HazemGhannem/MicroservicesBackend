import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PORT } from './db/env';
import connectDB from './db/db';
import { producer, consumer } from './kafka/config';
import userRoutes from './router/user.router';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later' },
  }),
);

// ── Auth routes get stricter rate limiting ────────────────────────────────────
app.use(
  '/api/users/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts' },
  }),
);
app.use(
  '/api/users/signup',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Too many signup attempts' },
  }),
);

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'user-service',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/users', userRoutes);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  // 1. Connect MongoDB
  await connectDB();

  // 2. Connect Kafka producer
  await producer.connect();

  logger.info('Kafka consumer listening on user-created');

  // 3. Start HTTP server
  const server = app.listen(PORT, () => {
    logger.info(`User service running on port ${PORT}`);
  });

  // 4. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await consumer.disconnect();
      await producer.disconnect();
      logger.info('Kafka disconnected');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Bootstrap failed');
  process.exit(1);
});
