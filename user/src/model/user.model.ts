import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../interface/user.interface';

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
