import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET as string;
export const MONGO_URI = process.env.MONGO_URI as string;
export const PORT = process.env.PORT as string;
export const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
export const NODE_ENV = process.env.NODE_ENV as string;
export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID as string;
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET as string;
export const PAYPAL_MODE = process.env.PAYPAL_MODE as string;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;
export const PAYPAL_SANDBOX_API = process.env.PAYPAL_SANDBOX_API as string;
export const PAYPAL_API = process.env.PAYPAL_API as string;
