import { Product } from '../model/product.model';
import { AppError } from '../middleware/error.middleware';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from '../validation/product.validation';
import {
  sendProductCreated,
  sendProductDeleted,
  sendProductOutOfStock,
} from '../kafka/product.producer';

// ── Get all products with search, filter, pagination ─────────────────────────
export const getAllProducts = async (query: ProductQueryInput) => {
  const {
    page,
    pageSize,
    search,
    category,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  } = query;

  const filter: Record<string, any> = { isActive: true };

  // ── Full text search ──────────────────────────────────────────────────────
  if (search) {
    filter.$text = { $search: search };
  }

  // ── Category filter ───────────────────────────────────────────────────────
  if (category) {
    filter.category = category.toLowerCase();
  }

  // ── Price range filter ────────────────────────────────────────────────────
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const skip = (page - 1) * pageSize;
  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  // ── Run query + count in parallel ─────────────────────────────────────────
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
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

// ── Get single product ────────────────────────────────────────────────────────
export const getProductById = async (id: string) => {
  const product = await Product.findById(id).lean();
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

// ── Create product ────────────────────────────────────────────────────────────
export const createProduct = async (
  data: CreateProductInput,
  userId: string,
  images: string[],
) => {
  const product = await Product.create({
    ...data,
    images,
    createdBy: userId,
  });
  await sendProductCreated({
    productId: product._id.toString(),
    name: product.name,
    createdBy: userId,
  });
  return product;
};

// ── Update product ────────────────────────────────────────────────────────────
export const updateProduct = async (
  id: string,
  data: UpdateProductInput,
  userId: string,
  userEmail: string,
  newImages?: string[],
) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  // ✅ only owner can update
  if (product.createdBy !== userId) {
    throw new AppError('Not authorized to update this product', 403);
  }

  const updateData: any = { ...data };
  if (newImages && newImages.length > 0) {
    updateData.images = [...product.images, ...newImages]; // append new images
  }

  const updated = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (updated && updated.stock === 0) {
    await sendProductOutOfStock({
      productId: updated._id.toString(),
      name: updated.name,
      ownerEmail: userEmail,
    });
  }
  return updated;
};

// ── Delete product ────────────────────────────────────────────────────────────
export const deleteProduct = async (id: string, userId: string) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  if (product.createdBy !== userId) {
    throw new AppError('Not authorized to delete this product', 403);
  }

  // ✅ soft delete — just deactivate
  await Product.findByIdAndUpdate(id, { isActive: false });
  await sendProductDeleted({
    productId: product._id.toString(),
    name: product.name,
    createdBy: userId,
  });
};

// ── Delete single image from product ─────────────────────────────────────────
export const deleteProductImage = async (
  id: string,
  imageUrl: string,
  userId: string,
) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  if (product.createdBy !== userId) {
    throw new AppError('Not authorized', 403);
  }

  const updated = await Product.findByIdAndUpdate(
    id,
    { $pull: { images: imageUrl } },
    { new: true },
  );
  return updated;
};
