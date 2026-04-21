import { Router } from 'express';
import { store } from '../lib/store.js';

export const calendarRouter = Router();

calendarRouter.get('/summary/:userId', (req, res) => {
  const workoutDays = new Set(
    store.setLogs
      .filter((candidate) => candidate.userId === req.params.userId)
      .map((candidate) => candidate.performedAt.slice(0, 10))
  );

  const sortedDays = Array.from(workoutDays).sort();
  let streak = 0;

  for (let i = sortedDays.length - 1; i >= 0; i -= 1) {
    if (i === sortedDays.length - 1) {
      streak = 1;
      continue;
    }

    const current = new Date(sortedDays[i + 1]);
    const previous = new Date(sortedDays[i]);
    const diff = (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000);

    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  res.status(200).json({
    workoutDays: sortedDays,
    streak,
    totalWorkouts: sortedDays.length,
    totalMealsLogged: store.mealLogs.filter((candidate) => candidate.userId === req.params.userId).length
  });
});
