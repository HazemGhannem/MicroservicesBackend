import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express';
import { AppError } from './error.middleware';
import cloudinary from '../utils/cloudinary';

// ── Cloudinary storage ────────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products', // ✅ folder in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }], // ✅ auto resize
  } as any,
});

// ── File filter — images only ─────────────────────────────────────────────────
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // max 5 images
  },
});

// ── Helper: get Cloudinary URLs ───────────────────────────────────────────────
export const getImageUrls = (files: Express.Multer.File[]): string[] => {
  return files.map((file: any) => file.path); // ✅ Cloudinary returns full URL in file.path
};
