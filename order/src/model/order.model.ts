import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../interface/order.interface';

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, required: true, index: true },

    items: { type: [OrderItemSchema], required: true },

    shippingAddress: { type: ShippingAddressSchema, required: true },

    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'cash_on_delivery'],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },

    paymentId: { type: String }, // reference to Payment service record

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    notes: { type: String },
    cancelReason: { type: String },
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
