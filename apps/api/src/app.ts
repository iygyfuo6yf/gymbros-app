import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { onboardingRouter } from './routes/onboarding.js';
import { nutritionRouter } from './routes/nutrition.js';
import { mealsRouter } from './routes/meals.js';
import { workoutRouter } from './routes/workouts.js';
import { calendarRouter } from './routes/calendar.js';
import { syncRouter } from './routes/sync.js';
import { gymsRouter } from './routes/gyms.js';
import { errorHandler } from './lib/errors.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'gymbros-api' });
});

app.use('/auth', authRouter);
app.use('/onboarding', onboardingRouter);
app.use('/nutrition', nutritionRouter);
app.use('/meals', mealsRouter);
app.use('/workouts', workoutRouter);
app.use('/calendar', calendarRouter);
app.use('/sync', syncRouter);
app.use('/gyms', gymsRouter);

app.use(errorHandler);
