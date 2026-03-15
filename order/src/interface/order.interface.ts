import { Document } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'stripe' | 'paypal' | 'cash_on_delivery';

export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  userId: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;  
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  notes?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
