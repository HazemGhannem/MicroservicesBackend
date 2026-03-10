import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middlware';
import * as orderService from '../service/order.service';
import {
  OrderQueryInput,
  CreateOrderInput,
  UpdateOrderStatusInput,
} from '../validation/order.validation';

// ── POST /api/orders ──────────────────────────────────────────────────────────
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await orderService.createOrder(
      req.body as CreateOrderInput,
      req.userId!,
      req.userEmail!,
    );
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders ───────────────────────────────────────────────────────────
export const getOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await orderService.getOrders(
      req.query as unknown as OrderQueryInput,
      req.userId!,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
export const getOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await orderService.getOrderById(
      req.params.id as string,
      req.userId!,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/orders/:id/status ────────────────────────────────────────────────
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id as string,
      req.body as UpdateOrderStatusInput,
      req.userEmail!,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/orders/:id ────────────────────────────────────────────────────
export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const order = await orderService.cancelOrder(
      req.params.id as string,
      req.userId!,
      req.userEmail!,
      req.body.reason,
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
};
