import { Order } from '../model/order.model';
import { AppError } from '../middleware/error.middleware';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  OrderQueryInput,
} from '../validation/order.validation';
import {
  sendOrderPlaced,
  sendOrderStatusUpdated,
  sendPaymentRequested,
} from '../kafka/order.producer';

// ── Request Payment ──────────────────────────────────────────────────────────────
const requestPayment = async (data: {
  orderId: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  token: string;
}) => {
  const res = await fetch('http://payment-service:5004/api/payments/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
    body: JSON.stringify({
      orderId: data.orderId,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
    }),
  });

  if (!res.ok) throw new AppError('Payment service failed', 502);
  return res.json();
};
// ── Create order ──────────────────────────────────────────────────────────────
export const createOrder = async (
  data: CreateOrderInput,
  userId: string,
  userEmail: string,
) => {
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = +(subtotal - data.discount + data.shippingCost).toFixed(2);

  const order = await Order.create({
    userId,
    items: data.items,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    subtotal,
    discount: data.discount,
    shippingCost: data.shippingCost,
    total,
    // COD is confirmed immediately — no payment service needed
    status: data.paymentMethod === 'cash_on_delivery' ? 'confirmed' : 'pending',
    paymentStatus:
      data.paymentMethod === 'cash_on_delivery' ? 'unpaid' : 'unpaid',
  });

  const orderId = order._id.toString();

  // ── Notify payment service via Kafka (only for online payments) ──────────
  if (data.paymentMethod !== 'cash_on_delivery') {
    sendPaymentRequested({
      orderId,
      userId,
      userEmail,
      amount: total,
      paymentMethod: data.paymentMethod,
    });
  }

  // ── Notify email service ─────────────────────────────────────────────────
  sendOrderPlaced({
    orderId,
    userId,
    userEmail,
    total,
    items: data.items.map((i) => ({ name: i.name, quantity: i.quantity })),
  });

  return order;
};

// ── Get all orders (user's own) ───────────────────────────────────────────────
export const getOrders = async (query: OrderQueryInput, userId: string) => {
  const { page, pageSize, status, sortOrder } = query;
  const filter: Record<string, any> = { userId };
  if (status) filter.status = status;

  const skip = (page - 1) * pageSize;
  const sort = { createdAt: sortOrder === 'asc' ? 1 : -1 } as const;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page < Math.ceil(total / pageSize),
      hasPrev: page > 1,
    },
  };
};

// ── Get single order ──────────────────────────────────────────────────────────
export const getOrderById = async (id: string, userId: string) => {
  const order = await Order.findById(id).lean();
  if (!order) throw new AppError('Order not found', 404);
  if (order.userId !== userId) throw new AppError('Not authorized', 403);
  return order;
};

// ── Update order status (admin) ───────────────────────────────────────────────
export const updateOrderStatus = async (
  id: string,
  data: UpdateOrderStatusInput,
  userEmail: string,
) => {
  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found', 404);

  if (['delivered', 'cancelled'].includes(order.status)) {
    throw new AppError(`Cannot update a ${order.status} order`, 400);
  }

  const updated = await Order.findByIdAndUpdate(
    id,
    {
      status: data.status,
      ...(data.cancelReason && { cancelReason: data.cancelReason }),
    },
    { new: true },
  );

  sendOrderStatusUpdated({
    orderId: id,
    userId: order.userId,
    userEmail,
    status: data.status,
  });

  return updated;
};

// ── Cancel order (user) ───────────────────────────────────────────────────────
export const cancelOrder = async (
  id: string,
  userId: string,
  userEmail: string,
  reason?: string,
) => {
  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.userId !== userId) throw new AppError('Not authorized', 403);

  if (['shipped', 'delivered'].includes(order.status)) {
    throw new AppError('Cannot cancel a shipped or delivered order', 400);
  }

  // If already paid, tell payment service to refund via Kafka
  if (order.paymentStatus === 'paid' && order.paymentId) {
    const { producer } = await import('../kafka/config');
    await producer.send({
      topic: 'refund-requested',
      messages: [
        {
          value: JSON.stringify({
            orderId: id,
            paymentId: order.paymentId,
            userId,
            userEmail,
            amount: order.total,
          }),
        },
      ],
    });
  }

  const updated = await Order.findByIdAndUpdate(
    id,
    {
      status: 'cancelled',
      cancelReason: reason,
      ...(order.paymentStatus === 'paid' && { paymentStatus: 'refunded' }),
    },
    { new: true },
  );

  sendOrderStatusUpdated({
    orderId: id,
    userId,
    userEmail,
    status: 'cancelled',
  });
  return updated;
};
