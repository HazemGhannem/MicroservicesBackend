import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../model/user.model';
import { IUserLogin, IUserRegister } from '../interface/user.interface';
import { JWT_SECRET } from '../db/env';
import { sendUserCreated } from '../kafka/product.producer';

export const registerUser = async ({
  email,
  name,
  password,
}: IUserRegister) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('Email already in use');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  // ── Publish to Kafka → email service sends welcome email ─────────────
  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET || 'secret',
    {
      expiresIn: '7d',
    },
  );
  await sendUserCreated({ email: user.email, name: user.name });
  return { token };
};
export const loginUser = async ({ email, password }: IUserLogin) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET || 'secret',
    {
      expiresIn: '7d',
    },
  );
  
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};
