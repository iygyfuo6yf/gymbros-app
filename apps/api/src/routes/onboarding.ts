import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/apiError.js';
import { store } from '../lib/store.js';
import { sanitizedId } from '../lib/validation.js';
import { calculateTargets } from '../services/nutrition.js';

const bodySchema = z.object({
  userId: sanitizedId(),
  age: z.number().int().min(13).max(100),
  sex: z.enum(['male', 'female']),
  weightKg: z.number().min(35).max(250),
  heightCm: z.number().min(130).max(230),
  activityLevel: z.enum(['low', 'moderate', 'high']),
  goal: z.enum(['cut', 'maintain', 'bulk'])
}).strict();

export const onboardingRouter = Router();

onboardingRouter.post('/', (req, res) => {
  const payload = bodySchema.parse(req.body);
  const user = store.users.find((candidate) => candidate.id === payload.userId);

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const targets = calculateTargets(payload);
  const profile = {
    ...payload,
    ...targets,
    updatedAt: new Date().toISOString()
  };

  const existingIndex = store.profiles.findIndex((candidate) => candidate.userId === payload.userId);
  if (existingIndex >= 0) {
    store.profiles[existingIndex] = profile;
  } else {
    store.profiles.push(profile);
  }

  res.status(200).json(profile);
});
