import { Router } from 'express';
import { store } from '../lib/store.js';
import { recommendMeals } from '../services/nutrition.js';

export const nutritionRouter = Router();

nutritionRouter.get('/recommendations/:userId', (req, res) => {
  const profile = store.profiles.find((candidate) => candidate.userId === req.params.userId);
  if (!profile) {
    res.status(404).json({ error: 'Onboarding profile not found' });
    return;
  }

  res.status(200).json({ targets: profile, meals: recommendMeals(profile) });
});
