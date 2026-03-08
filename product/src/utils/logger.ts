import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
});
