import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import productRouter from './routers/product.router';
import { errorHandler } from './middleware/error.middleware';
import { producer } from './kafka/config';
import connectDB from './db/db';
import { PORT } from './db/env';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser()); // ✅ required for cookie auth

// ── Static files (serve uploaded images) ─────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'product-service' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/products', productRouter);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  // 1. Connect MongoDB
  await connectDB();

  // 2. Connect Kafka producer
  await producer.connect();
  console.log('✅ Kafka producer connected');

  // 3. Start server
  const server = app.listen(PORT, () => {
    console.log(`✅ Product service running on PORT: ${PORT}`);
  });

  // 4. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down`);
    server.close(async () => {
      await producer.disconnect();
      await mongoose.disconnect();
      console.log('✅ Disconnected cleanly');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
