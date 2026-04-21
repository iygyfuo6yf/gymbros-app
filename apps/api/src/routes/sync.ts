import { Router } from 'express';
import { z } from 'zod';
import { store } from '../lib/store.js';
import { mergeLatest } from '../services/sync.js';

const syncSchema = z.object({
  userId: z.string().min(1),
  mealLogs: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    mealName: z.string(),
    calories: z.number(),
    proteinGrams: z.number(),
    carbsGrams: z.number(),
    fatsGrams: z.number(),
    confidence: z.number(),
    source: z.enum(['ai', 'manual']),
    consumedAt: z.string(),
    updatedAt: z.string()
  })),
  workoutSetLogs: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    exerciseId: z.string(),
    reps: z.number(),
    weightKg: z.number(),
    repRange: z.string(),
    performedAt: z.string(),
    updatedAt: z.string()
  }))
});

export const syncRouter = Router();

syncRouter.post('/', (req, res) => {
  const payload = syncSchema.parse(req.body);

  const serverMeals = store.mealLogs.filter((candidate) => candidate.userId === payload.userId);
  const mergedMeals = mergeLatest(serverMeals, payload.mealLogs);
  store.mealLogs = [...store.mealLogs.filter((candidate) => candidate.userId !== payload.userId), ...mergedMeals];

  const serverSets = store.setLogs.filter((candidate) => candidate.userId === payload.userId);
  const mergedSets = mergeLatest(serverSets, payload.workoutSetLogs);
  store.setLogs = [...store.setLogs.filter((candidate) => candidate.userId !== payload.userId), ...mergedSets];

  res.status(200).json({
    mealLogs: mergedMeals,
    workoutSetLogs: mergedSets,
    strategy: 'latest-edit-with-safe-merge'
  });
});
