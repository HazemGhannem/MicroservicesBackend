import express from 'express';
import {
  registerUserController,
  loginController,
  getProfileController,
} from '../controller/user.controller';
import { authMiddleware } from '../middleware/auth.middlwaare';
import {
  validate,
  registerSchema,
  loginSchema,
} from '../middleware/validation.middlware';

const router = express.Router();

router.post('/signup', validate(registerSchema), registerUserController);
router.post('/login', validate(loginSchema), loginController);
router.get('/profile', authMiddleware, getProfileController);

export default router;
