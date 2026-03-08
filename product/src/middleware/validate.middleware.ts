// ── validate.middleware.ts ────────────────────────────────────────────────────
import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req[target]);
      req[target] = result; // ✅ replace with coerced/validated values
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // ✅ must call next(err) so errorHandler catches it
        res.status(400).json({
          error: 'Validation failed',
          details: err.issues,
        });
        return;
      }
      next(err); // ✅ unexpected errors go to error handler
    }
  };
