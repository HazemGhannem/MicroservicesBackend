import { Router } from 'express';
import * as orderController from '../controller/order.controller';
import { authMiddleware } from '../middleware/auth.middlware';
import { validate } from '../middleware/validate.middleware';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from '../validation/order.validation';

const router = Router();

// ── GET /api/orders ───────────────────────────────────────────────────────────
router.get(
  '/',
  authMiddleware,
  validate(orderQuerySchema, 'query'),
  orderController.getOrders,
);

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
router.get('/:id', authMiddleware, orderController.getOrder);

// ── POST /api/orders ──────────────────────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  validate(createOrderSchema),
  orderController.createOrder,
);

// ── PUT /api/orders/:id/status ────────────────────────────────────────────────
router.put(
  '/:id/status',
  authMiddleware,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);

// ── DELETE /api/orders/:id ────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, orderController.cancelOrder);

export default router;
