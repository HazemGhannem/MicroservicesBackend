import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../interface/product.interface';

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true, // ✅ for faster search
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// ── Text index for full-text search ──────────────────────────────────────────
ProductSchema.index({ name: 'text', description: 'text', category: 'text' });

// ── Virtual: final price after discount ──────────────────────────────────────
ProductSchema.virtual('finalPrice').get(function () {
  if (!this.discount) return this.price;
  return +(this.price * (1 - this.discount / 100)).toFixed(2);
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
