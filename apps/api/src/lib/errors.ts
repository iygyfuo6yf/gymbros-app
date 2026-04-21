import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = error instanceof ZodError ? 400 : 500;
  res.status(status).json({ error: message });
};
