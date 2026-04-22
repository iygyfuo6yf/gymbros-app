import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, toApiError } from './apiError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json(
      toApiError(
        400,
        'VALIDATION_ERROR',
        'Request validation failed',
        error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
      )
    );
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json(toApiError(error.status, error.code, error.message, error.details));
    return;
  }

  res.status(500).json(toApiError(500, 'INTERNAL_ERROR', 'Unexpected server error'));
};
