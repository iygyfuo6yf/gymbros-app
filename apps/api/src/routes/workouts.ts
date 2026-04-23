import { Router } from 'express';
import { z } from 'zod';
import type { RoutineEntry, RoutineTemplate, WorkoutSetLog } from '@prisma/client';
import { AppError } from '../lib/apiError.js';
import { isoDateTime, sanitizedId, sanitizedString } from '../lib/validation.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';

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

workoutRouter.get('/exercises', asyncHandler(async (req, res) => {
  const q = `${req.query.q ?? ''}`.toLowerCase();
  const muscle = `${req.query.muscle ?? ''}`.toLowerCase();
  const equipment = `${req.query.equipment ?? ''}`.toLowerCase();
  const goal = `${req.query.goal ?? ''}`.toLowerCase();

  const filtered = await prisma.exercise.findMany({
    where: {
      ...(q ? { name: { contains: q } } : {}),
      ...(muscle ? { muscleGroup: muscle } : {}),
      ...(equipment ? { equipment } : {}),
      ...(goal ? { goal } : {})
    },
    orderBy: { name: 'asc' }
  });

  res.status(200).json(filtered);
}));

workoutRouter.get('/templates', asyncHandler(async (req, res) => {
  const goal = `${req.query.goal ?? ''}`;
  const templates = await prisma.routineTemplate.findMany({
    where: goal ? { goal } : undefined,
    orderBy: { name: 'asc' }
  });

  res.status(200).json(templates.map((template: RoutineTemplate) => ({
    id: template.id,
    goal: template.goal,
    name: template.name,
    exercises: JSON.parse(template.exercises)
  })));
}));

workoutRouter.post('/routines', asyncHandler(async (req, res) => {
  const payload = routineSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const exerciseIds = payload.exercises.map((exercise) => exercise.exerciseId);
  const exerciseCount = await prisma.exercise.count({ where: { id: { in: exerciseIds } } });
  if (exerciseCount !== exerciseIds.length) {
    throw new AppError(404, 'EXERCISE_NOT_FOUND', 'One or more exercises were not found');
  }

  const routine = await prisma.workoutRoutine.create({
    data: {
      userId: payload.userId,
      name: payload.name,
      entries: {
        create: payload.exercises.map((exercise, index) => ({
          exerciseId: exercise.exerciseId,
          repRange: exercise.repRange,
          orderIndex: index
        }))
      }
    },
    include: { entries: true }
  });

  res.status(201).json({
    id: routine.id,
    userId: routine.userId,
    name: routine.name,
    exercises: routine.entries
      .sort((a: RoutineEntry, b: RoutineEntry) => a.orderIndex - b.orderIndex)
      .map((entry: RoutineEntry) => ({
      exerciseId: entry.exerciseId,
      repRange: entry.repRange
      })),
    updatedAt: routine.updatedAt.toISOString()
  });
}));

workoutRouter.post('/sets', asyncHandler(async (req, res) => {
  const payload = setLogSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  const exercise = await prisma.exercise.findUnique({ where: { id: payload.exerciseId } });
  if (!exercise) {
    throw new AppError(404, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }

  const setLog = await prisma.workoutSetLog.create({
    data: {
      userId: payload.userId,
      exerciseId: payload.exerciseId,
      reps: payload.reps,
      weightKg: payload.weightKg,
      repRange: payload.repRange,
      performedAt: new Date(payload.performedAt)
    }
  });

  res.status(201).json({ ...setLog, performedAt: setLog.performedAt.toISOString(), updatedAt: setLog.updatedAt.toISOString() });
}));

workoutRouter.get('/progressive/:userId/:exerciseId', asyncHandler(async (req, res) => {
  const logs = await prisma.workoutSetLog.findMany({
    where: {
      userId: req.params.userId,
      exerciseId: req.params.exerciseId
    },
    orderBy: { performedAt: 'asc' }
  });

  const trend = logs.map((entry: WorkoutSetLog) => ({
    performedAt: entry.performedAt.toISOString(),
    estimated1RM: Number((entry.weightKg * (1 + entry.reps / 30)).toFixed(2))
  }));

  res.status(200).json({
    logs: logs.map((entry: WorkoutSetLog) => ({
      ...entry,
      performedAt: entry.performedAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    })),
    trend
  });
}));
