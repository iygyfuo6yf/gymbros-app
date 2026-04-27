import { Router } from 'express';
import { AppError } from '../lib/apiError.js';
import { prisma } from '../lib/prisma.js';
import { recommendMeals } from '../services/nutrition.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const nutritionRouter = Router();

nutritionRouter.get('/recommendations/:userId', asyncHandler(async (req, res) => {
  const profile = await prisma.userProfile.findUnique({ where: { userId: req.params.userId } });
  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Onboarding profile not found');
  }

  res.status(200).json({
    targets: {
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
    },
    meals: recommendMeals({
      userId: profile.userId,
      age: profile.age,
      sex: profile.sex as 'male' | 'female',
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      activityLevel: profile.activityLevel as 'low' | 'moderate' | 'high',
      goal: profile.goal as 'cut' | 'maintain' | 'bulk',
      dailyCalories: profile.dailyCalories,
      proteinGrams: profile.proteinGrams,
      carbsGrams: profile.carbsGrams,
      fatsGrams: profile.fatsGrams,
      updatedAt: profile.updatedAt.toISOString()
    })
  });
}));
