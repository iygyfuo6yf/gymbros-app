import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/apiError.js';
import { isoDateTime, sanitizedId, sanitizedString } from '../lib/validation.js';
import { store } from '../lib/store.js';
import { mergeLatest } from '../services/sync.js';

const syncSchema = z.object({
  userId: sanitizedId(),
  mealLogs: z.array(z.object({
    id: sanitizedId(),
    userId: sanitizedId(),
    mealName: sanitizedString(1, 100),
    calories: z.number(),
    proteinGrams: z.number(),
    carbsGrams: z.number(),
    fatsGrams: z.number(),
    confidence: z.number(),
    source: z.enum(['ai', 'manual']),
    consumedAt: isoDateTime(),
    updatedAt: isoDateTime()
  }).strict()),
  workoutSetLogs: z.array(z.object({
    id: sanitizedId(),
    userId: sanitizedId(),
    exerciseId: sanitizedId(),
    reps: z.number(),
    weightKg: z.number(),
    repRange: sanitizedString(3, 20),
    performedAt: isoDateTime(),
    updatedAt: isoDateTime()
  }).strict())
}).strict();

export const syncRouter = Router();

syncRouter.post('/', (req, res) => {
  const payload = syncSchema.parse(req.body);
  const user = store.users.find((candidate) => candidate.id === payload.userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (payload.mealLogs.some((candidate) => candidate.userId !== payload.userId)) {
    throw new AppError(400, 'SYNC_USER_MISMATCH', 'Meal logs include records for another user');
  }
  if (payload.workoutSetLogs.some((candidate) => candidate.userId !== payload.userId)) {
    throw new AppError(400, 'SYNC_USER_MISMATCH', 'Workout logs include records for another user');
  }

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
