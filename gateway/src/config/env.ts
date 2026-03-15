import dotenv from 'dotenv';
dotenv.config();

export const USER_SERVICE_URL = process.env.USER_SERVICE_URL as string;
export const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL as string;
export const PORT = process.env.PORT as string;
export const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL;
export const NODE_ENV = process.env.NODE_ENV as string;
export const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL as string;
export const FRONTEND_URL = process.env.FRONTEND_URL as string;
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 200;
export const RATE_LIMIT_WINDOW =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
