import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const calendarRouter = Router();
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

calendarRouter.get('/summary/:userId', asyncHandler(async (req, res) => {
  const [setLogs, mealLogs] = await Promise.all([
    prisma.workoutSetLog.findMany({ where: { userId: req.params.userId }, orderBy: { performedAt: 'asc' } }),
    prisma.mealLog.findMany({ where: { userId: req.params.userId } })
  ]);

  const workoutDays = new Set(setLogs.map((candidate) => candidate.performedAt.toISOString().slice(0, 10)));
  const sortedDays = Array.from(workoutDays).sort();
  let streak = 0;

  for (let i = sortedDays.length - 1; i >= 0; i -= 1) {
    if (i === sortedDays.length - 1) {
      streak = 1;
      continue;
    }

    const current = new Date(sortedDays[i + 1]);
    const previous = new Date(sortedDays[i]);
    const diff = (current.getTime() - previous.getTime()) / MILLISECONDS_IN_DAY;

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
    totalMealsLogged: mealLogs.length
  });
}));

calendarRouter.get('/trends/:userId', asyncHandler(async (req, res) => {
  const [setLogs, mealLogs, profile] = await Promise.all([
    prisma.workoutSetLog.findMany({ where: { userId: req.params.userId }, orderBy: { performedAt: 'asc' } }),
    prisma.mealLog.findMany({ where: { userId: req.params.userId }, orderBy: { consumedAt: 'asc' } }),
    prisma.userProfile.findUnique({ where: { userId: req.params.userId } })
  ]);

  const byDay = new Map<string, { volumeKg: number; estimated1RM: number; calories: number }>();

  for (const entry of setLogs) {
    const day = entry.performedAt.toISOString().slice(0, 10);
    const existing = byDay.get(day) ?? { volumeKg: 0, estimated1RM: 0, calories: 0 };
    const entry1RM = entry.weightKg * (1 + entry.reps / 30);
    byDay.set(day, {
      ...existing,
      volumeKg: Number((existing.volumeKg + entry.weightKg * entry.reps).toFixed(2)),
      estimated1RM: Number(Math.max(existing.estimated1RM, entry1RM).toFixed(2))
    });
  }

  for (const meal of mealLogs) {
    const day = meal.consumedAt.toISOString().slice(0, 10);
    const existing = byDay.get(day) ?? { volumeKg: 0, estimated1RM: 0, calories: 0 };
    byDay.set(day, {
      ...existing,
      calories: existing.calories + meal.calories
    });
  }

  const adherenceTarget = profile?.dailyCalories ?? null;
  const points = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      volumeKg: value.volumeKg,
      estimated1RM: value.estimated1RM,
      calories: value.calories,
      adherencePct: adherenceTarget ? Number((Math.min(1, value.calories / adherenceTarget) * 100).toFixed(2)) : null
    }));

  res.status(200).json({ points, targetCalories: adherenceTarget });
}));
