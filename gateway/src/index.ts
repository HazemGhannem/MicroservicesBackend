import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import { PORT, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } from './config/env';
import { logger } from './utils/logger';
import {
  FRONTEND_URL,
  ORDER_SERVICE_URL,
  PAYMENT_SERVICE_URL,
  PRODUCT_SERVICE_URL,
  USER_SERVICE_URL,
} from './config/env';
import { proxy } from './proxy';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL || 'http://localhost:3001',
    credentials: true, //
  }),
);
app.use(
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    message: { error: 'Too many requests, please try again later' },
  }),
);

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    version: '1.0.0',
    services: {
      user: USER_SERVICE_URL,
      product: PRODUCT_SERVICE_URL,
      order: ORDER_SERVICE_URL,
      payment: PAYMENT_SERVICE_URL,
    },
  });
});
app.use('/api/users', proxy(USER_SERVICE_URL, 'user-service'));
app.use('/api/products', proxy(PRODUCT_SERVICE_URL, 'product-service'));
app.use('/api/orders', proxy(ORDER_SERVICE_URL, 'order-service'));
app.use('/api/payments', proxy(PAYMENT_SERVICE_URL, 'payment-service'));
// ── Proxy all routes ──────────────────────────────────────────────────────────
 
// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`✅ API Gateway running on port ${PORT}`);
  logger.info(
    {
      routes: [
        'POST/GET /api/auth      → user-service:5001',
        'GET/POST /api/products  → product-service:5002',
        'GET/POST /api/orders    → order-service:5003',
        'GET/POST /api/payments  → payment-service:5004',
      ],
    },
    '📡 Proxying routes',
  );
});
