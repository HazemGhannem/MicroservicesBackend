import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET as string;
export const MONGO_URI = process.env.MONGO_URI as string;
export const PORT = process.env.PORT as string;
export const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
export const NODE_ENV = process.env.NODE_ENV as string;
export const PAYMENT_API = process.env.PAYMENT_API as string;

