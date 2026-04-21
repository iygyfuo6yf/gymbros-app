import { Router } from 'express';
import { AppError } from '../lib/apiError.js';
import { store } from '../lib/store.js';
import { recommendMeals } from '../services/nutrition.js';

export const nutritionRouter = Router();

nutritionRouter.get('/recommendations/:userId', (req, res) => {
  const profile = store.profiles.find((candidate) => candidate.userId === req.params.userId);
  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Onboarding profile not found');
  }

  res.status(200).json({ targets: profile, meals: recommendMeals(profile) });
});
