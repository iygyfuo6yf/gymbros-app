import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { onboardingRouter } from './routes/onboarding.js';
import { nutritionRouter } from './routes/nutrition.js';
import { mealsRouter } from './routes/meals.js';
import { workoutRouter } from './routes/workouts.js';
import { calendarRouter } from './routes/calendar.js';
import { syncRouter } from './routes/sync.js';
import { gymsRouter } from './routes/gyms.js';
import { watchRouter } from './routes/watch.js';
import { AppError } from './lib/apiError.js';
import { errorHandler } from './lib/errors.js';
import { authRateLimiter } from './lib/rateLimit.js';
import { prisma } from './lib/prisma.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'gymbros-api', status: 'live' });
});

app.get('/ready', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      service: 'gymbros-api',
      status: 'ready',
      checks: {
        env: Boolean(env.JWT_SECRET && env.DATABASE_URL),
        database: true
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use('/auth', authRateLimiter, authRouter);
app.use('/onboarding', onboardingRouter);
app.use('/nutrition', nutritionRouter);
app.use('/meals', mealsRouter);
app.use('/workouts', workoutRouter);
app.use('/calendar', calendarRouter);
app.use('/sync', syncRouter);
app.use('/gyms', gymsRouter);
app.use('/watch', watchRouter);

app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
});

app.use(errorHandler);
