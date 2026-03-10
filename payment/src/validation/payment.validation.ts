import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentMethod: z.enum(['stripe', 'paypal']),
});

export const capturePayPalSchema = z.object({
  paypalOrderId: z.string().min(1),
  orderId: z.string().min(1),
});

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type CapturePayPalInput = z.infer<typeof capturePayPalSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
