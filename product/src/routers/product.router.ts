import { Router } from 'express';
import * as productController from '../controller/product.controller';
import { authMiddleware } from '../middleware/auth.middlware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validation/product.validation';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get(
  '/',
  validate(productQuerySchema, 'query'),
  productController.getProducts,
);

router.get('/:id', productController.getProduct);

// ── Protected routes (JWT required) ──────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  upload.array('images', 5), // ✅ up to 5 images
  validate(createProductSchema),
  productController.createProduct,
);

router.put(
  '/:id',
  authMiddleware,
  upload.array('images', 5),
  validate(updateProductSchema),
  productController.updateProduct,
);

router.delete('/:id', authMiddleware, productController.deleteProduct);

router.delete('/:id/images', authMiddleware, productController.deleteImage);

export default router;
