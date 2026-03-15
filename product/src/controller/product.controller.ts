import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middlware';
import { getImageUrls } from '../middleware/upload.middleware';
import * as productService from '../service/product.service';
import { ProductQueryInput } from '../validation/product.validation';
// ── GET /api/products ─────────────────────────────────────────────────────────
export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await productService.getAllProducts(
      req.query as unknown as ProductQueryInput,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/products/:id ─────────────────────────────────────────────────────
export const getProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const product = await productService.getProductById(
      req.params.id as string,
    );
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/products ────────────────────────────────────────────────────────
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const images = getImageUrls(files);

    const product = await productService.createProduct(
      req.body,
      req.userId!,
      images,
    );

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/products/:id ─────────────────────────────────────────────────────
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const newImages = files.length ? getImageUrls(files) : undefined;

    const product = await productService.updateProduct(
      req.params.id as string,
      req.body,
      req.userId!,
      req.userEmail!,
      newImages,
    );

    res.json(product);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await productService.deleteProduct(req.params.id as string, req.userId!);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/products/:id/images ──────────────────────────────────────────
export const deleteImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { imageUrl } = req.body;
    const product = await productService.deleteProductImage(
      req.params.id as string,
      imageUrl,
      req.userId!,
    );
    res.json(product);
  } catch (err) {
    next(err);
  }
};
