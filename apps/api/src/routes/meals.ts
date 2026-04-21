import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { estimateFromPhotoHint } from '../services/aiMeal.js';
import { store } from '../lib/store.js';

const analyzeSchema = z.object({
  photoHint: z.string().min(2)
});

const logSchema = z.object({
  userId: z.string().min(1),
  mealName: z.string().min(1),
  calories: z.number().int().min(0),
  proteinGrams: z.number().min(0),
  carbsGrams: z.number().min(0),
  fatsGrams: z.number().min(0),
  confidence: z.number().min(0).max(1),
  source: z.enum(['ai', 'manual']),
  consumedAt: z.string().datetime()
});

export const mealsRouter = Router();

mealsRouter.post('/analyze', (req, res) => {
  const payload = analyzeSchema.parse(req.body);
  const estimate = estimateFromPhotoHint(payload.photoHint);

  res.status(200).json({
    ...estimate,
    needsConfirmation: estimate.confidence < 0.7
  });
});

mealsRouter.post('/logs', (req, res) => {
  const payload = logSchema.parse(req.body);
  const meal = {
    id: uuid(),
    ...payload,
    updatedAt: new Date().toISOString()
  };

  store.mealLogs.push(meal);
  res.status(201).json(meal);
});

mealsRouter.put('/logs/:id', (req, res) => {
  const payload = logSchema.partial().parse(req.body);
  const index = store.mealLogs.findIndex((candidate) => candidate.id === req.params.id);

  if (index < 0) {
    res.status(404).json({ error: 'Meal log not found' });
    return;
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
