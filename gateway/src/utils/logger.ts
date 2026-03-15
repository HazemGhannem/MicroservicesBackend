import pino from 'pino';
import { NODE_ENV } from '../config/env';

export const logger = pino({
  level: NODE_ENV === 'production' ? 'warn' : 'debug',
  transport: NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});
