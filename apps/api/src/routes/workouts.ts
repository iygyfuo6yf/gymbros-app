import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { AppError } from '../lib/apiError.js';
import { isoDateTime, sanitizedId, sanitizedString } from '../lib/validation.js';
import { store } from '../lib/store.js';

const routineSchema = z.object({
  userId: sanitizedId(),
  name: sanitizedString(1, 100),
  exercises: z.array(z.object({
    exerciseId: sanitizedId(),
    repRange: sanitizedString(3, 20)
  }).strict()).min(1)
}).strict();

const setLogSchema = z.object({
  userId: sanitizedId(),
  exerciseId: sanitizedId(),
  reps: z.number().int().min(1),
  weightKg: z.number().min(0),
  repRange: sanitizedString(3, 20),
  performedAt: isoDateTime()
}).strict();

export const workoutRouter = Router();

workoutRouter.get('/exercises', (req, res) => {
  const q = `${req.query.q ?? ''}`.toLowerCase();
  const muscle = `${req.query.muscle ?? ''}`.toLowerCase();
  const equipment = `${req.query.equipment ?? ''}`.toLowerCase();

  const filtered = store.exercises.filter((exercise) => {
    const textMatch = !q || exercise.name.toLowerCase().includes(q);
    const muscleMatch = !muscle || exercise.muscleGroup === muscle;
    const equipmentMatch = !equipment || exercise.equipment === equipment;
    return textMatch && muscleMatch && equipmentMatch;
  });

  res.status(200).json(filtered);
});

workoutRouter.post('/routines', (req, res) => {
  const payload = routineSchema.parse(req.body);
  const user = store.users.find((candidate) => candidate.id === payload.userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  for (const exercise of payload.exercises) {
    if (!store.exercises.some((candidate) => candidate.id === exercise.exerciseId)) {
      throw new AppError(404, 'EXERCISE_NOT_FOUND', `Exercise not found: ${exercise.exerciseId}`);
    }
  }
  const routine = {
    id: uuid(),
    ...payload,
    updatedAt: new Date().toISOString()
  };

  store.routines.push(routine);
  res.status(201).json(routine);
});

workoutRouter.post('/sets', (req, res) => {
  const payload = setLogSchema.parse(req.body);
  const user = store.users.find((candidate) => candidate.id === payload.userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (!store.exercises.some((candidate) => candidate.id === payload.exerciseId)) {
    throw new AppError(404, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }
  const setLog = {
    id: uuid(),
    ...payload,
    updatedAt: new Date().toISOString()
  };

  store.setLogs.push(setLog);
  res.status(201).json(setLog);
});

workoutRouter.get('/progressive/:userId/:exerciseId', (req, res) => {
  const logs = store.setLogs
    .filter((candidate) => candidate.userId === req.params.userId && candidate.exerciseId === req.params.exerciseId)
    .sort((a, b) => a.performedAt.localeCompare(b.performedAt));

  const trend = logs.map((entry) => ({
    performedAt: entry.performedAt,
    // Epley estimate for trend tracking in MVP scaffold.
    estimated1RM: Number((entry.weightKg * (1 + entry.reps / 30)).toFixed(2))
  }));

  res.status(200).json({ logs, trend });
});
