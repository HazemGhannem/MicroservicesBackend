import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(1),
  image: z.string().url().optional(),
});

const shippingAddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['stripe', 'paypal', 'cash_on_delivery']),
  shippingCost: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'confirmed',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  cancelReason: z.string().optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum([
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
