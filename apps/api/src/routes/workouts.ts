import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { store } from '../lib/store.js';

const routineSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  exercises: z.array(z.object({
    exerciseId: z.string().min(1),
    repRange: z.string().min(3)
  })).min(1)
});

const setLogSchema = z.object({
  userId: z.string().min(1),
  exerciseId: z.string().min(1),
  reps: z.number().int().min(1),
  weightKg: z.number().min(0),
  repRange: z.string().min(3),
  performedAt: z.string().datetime()
});

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
    estimated1RM: Number((entry.weightKg * (1 + entry.reps / 30)).toFixed(2))
  }));

  res.status(200).json({ logs, trend });
});
