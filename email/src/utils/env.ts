import dotenv from 'dotenv';
dotenv.config();

export const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
export const GMAIL_USER = process.env.GMAIL_USER;
export const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
