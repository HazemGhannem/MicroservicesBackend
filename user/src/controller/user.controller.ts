import { Request, Response } from 'express';
import { IUser } from '../interface/user.interface';
import {
  getUserProfile,
  loginUser,
  registerUser,
} from '../service/user.service';

export const registerUserController = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body as IUser;

    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ error: 'Name, email, and password are required' });
    }

    const { token } = await registerUser({ email, name, password });

    return res.status(201).json({
      token,
    });
  } catch (error: any) {
    if (error.message === 'Email already in use') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Register user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await loginUser({ email, password });
    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json(result);
  } catch (err: any) {
    const message =
      err.message === 'User not found' || err.message === 'Invalid credentials'
        ? err.message
        : 'Internal server error';
    const status =
      err.message === 'User not found'
        ? 404
        : err.message === 'Invalid credentials'
          ? 401
          : 500;
    return res.status(status).json({ error: message });
  }
};

export const getProfileController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await getUserProfile(userId);
    return res.status(200).json(user);
  } catch (err: any) {
    const status = err.message === 'User not found' ? 404 : 500;
    return res.status(status).json({ error: err.message });
  }
};
