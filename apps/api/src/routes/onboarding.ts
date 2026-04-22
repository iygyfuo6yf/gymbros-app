import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/apiError.js';
import { prisma } from '../lib/prisma.js';
import { sanitizedId } from '../lib/validation.js';
import { calculateTargets } from '../services/nutrition.js';
import { asyncHandler } from '../lib/asyncHandler.js';

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

onboardingRouter.post('/', asyncHandler(async (req, res) => {
  const payload = bodySchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const targets = calculateTargets(payload);
  const profile = await prisma.userProfile.upsert({
    where: { userId: payload.userId },
    create: {
      ...payload,
      ...targets
    },
    update: {
      ...payload,
      ...targets
    }
  });

  res.status(200).json({
    userId: profile.userId,
    age: profile.age,
    sex: profile.sex,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    activityLevel: profile.activityLevel,
    goal: profile.goal,
    dailyCalories: profile.dailyCalories,
    proteinGrams: profile.proteinGrams,
    carbsGrams: profile.carbsGrams,
    fatsGrams: profile.fatsGrams,
    updatedAt: profile.updatedAt.toISOString()
  });
}));
