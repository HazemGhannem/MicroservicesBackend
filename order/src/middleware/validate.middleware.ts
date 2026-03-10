import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);

      if (target === 'body') {
        req.body = parsed; // ✅ body is writable
      } else if (target === 'params') {
        req.params = parsed as Record<string, string>; // ✅ params is writable
      } else if (target === 'query') {
        // ✅ query is read-only — merge instead of reassign
        Object.assign(req.query, parsed);
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res
          .status(400)
          .json({ error: 'Validation failed', details: err.issues });
        return;
      }
      next(err);
    }
  };
