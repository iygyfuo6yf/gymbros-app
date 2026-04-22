import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { AppError } from '../lib/apiError.js';
import { mealAnalysisRateLimiter } from '../lib/rateLimit.js';
import { isoDateTime, sanitizedId, sanitizedString } from '../lib/validation.js';
import { estimateFromPhotoHint } from '../services/aiMeal.js';
import { store } from '../lib/store.js';

const analyzeSchema = z.object({
  photoHint: sanitizedString(2, 200)
}).strict();

const logSchema = z.object({
  userId: sanitizedId(),
  mealName: sanitizedString(1, 100),
  calories: z.number().int().min(0),
  proteinGrams: z.number().min(0),
  carbsGrams: z.number().min(0),
  fatsGrams: z.number().min(0),
  confidence: z.number().min(0).max(1),
  source: z.enum(['ai', 'manual']),
  consumedAt: isoDateTime()
}).strict();

export const mealsRouter = Router();

mealsRouter.post('/analyze', mealAnalysisRateLimiter, (req, res) => {
  const payload = analyzeSchema.parse(req.body);
  const estimate = estimateFromPhotoHint(payload.photoHint);

  res.status(200).json({
    ...estimate,
    needsConfirmation: estimate.confidence < 0.7
  });
});

mealsRouter.post('/logs', (req, res) => {
  const payload = logSchema.parse(req.body);
  const user = store.users.find((candidate) => candidate.id === payload.userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  const meal = {
    id: uuid(),
    ...payload,
    updatedAt: new Date().toISOString()
  };

  store.mealLogs.push(meal);
  res.status(201).json(meal);
});

mealsRouter.put('/logs/:id', (req, res) => {
  const payload = logSchema.partial().strict().parse(req.body);
  const index = store.mealLogs.findIndex((candidate) => candidate.id === req.params.id);

  if (index < 0) {
    throw new AppError(404, 'MEAL_NOT_FOUND', 'Meal log not found');
  }

  store.mealLogs[index] = {
    ...store.mealLogs[index],
    ...payload,
    source: payload.source ?? store.mealLogs[index].source,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json(store.mealLogs[index]);
});

mealsRouter.get('/logs/:userId', (req, res) => {
  const logs = store.mealLogs.filter((candidate) => candidate.userId === req.params.userId);
  res.status(200).json(logs);
});
