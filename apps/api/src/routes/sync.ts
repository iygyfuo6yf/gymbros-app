import { Router } from 'express';
import { z } from 'zod';
import type { MealLog, Prisma, WorkoutSetLog } from '@prisma/client';
import { AppError } from '../lib/apiError.js';
import { isoDateTime, sanitizedId, sanitizedString } from '../lib/validation.js';
import { prisma } from '../lib/prisma.js';
import { mergeLatest } from '../services/sync.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const mealSchema = z.object({
  id: sanitizedId(),
  userId: sanitizedId(),
  mealName: sanitizedString(1, 100),
  calories: z.number(),
  proteinGrams: z.number(),
  carbsGrams: z.number(),
  fatsGrams: z.number(),
  confidence: z.number(),
  source: z.enum(['ai', 'manual']),
  confirmedByUser: z.boolean().default(false),
  photoPath: sanitizedString(1, 255).optional(),
  consumedAt: isoDateTime(),
  updatedAt: isoDateTime()
}).strict();

const setSchema = z.object({
  id: sanitizedId(),
  userId: sanitizedId(),
  exerciseId: sanitizedId(),
  reps: z.number(),
  weightKg: z.number(),
  repRange: sanitizedString(3, 20),
  performedAt: isoDateTime(),
  updatedAt: isoDateTime()
}).strict();

const syncSchema = z.object({
  userId: sanitizedId(),
  previewOnly: z.boolean().default(false),
  resolutions: z.array(z.object({ id: sanitizedId(), source: z.enum(['client', 'server']) })).default([]),
  mealLogs: z.array(mealSchema),
  workoutSetLogs: z.array(setSchema)
}).strict();

export const syncRouter = Router();

function buildConflictMap<T extends { id: string; updatedAt: string }>(
  serverRecords: T[],
  clientRecords: T[]
) {
  const conflicts: Array<{ id: string; server: T; client: T }> = [];
  const serverMap = new Map(serverRecords.map((record) => [record.id, record]));

  for (const client of clientRecords) {
    const server = serverMap.get(client.id);
    if (!server) {
      continue;
    }

    const serverComparable = { ...server, updatedAt: undefined };
    const clientComparable = { ...client, updatedAt: undefined };
    if (JSON.stringify(serverComparable) !== JSON.stringify(clientComparable)) {
      conflicts.push({ id: client.id, server, client });
    }
  }

  return conflicts;
}

syncRouter.post('/', asyncHandler(async (req, res) => {
  const payload = syncSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (payload.mealLogs.some((candidate) => candidate.userId !== payload.userId)) {
    throw new AppError(400, 'SYNC_USER_MISMATCH', 'Meal logs include records for another user');
  }
  if (payload.workoutSetLogs.some((candidate) => candidate.userId !== payload.userId)) {
    throw new AppError(400, 'SYNC_USER_MISMATCH', 'Workout logs include records for another user');
  }

  const [serverMealLogs, serverSetLogs] = await Promise.all([
    prisma.mealLog.findMany({ where: { userId: payload.userId } }),
    prisma.workoutSetLog.findMany({ where: { userId: payload.userId } })
  ]);

  const serverMeals = serverMealLogs.map((item: MealLog) => ({
    id: item.id,
    userId: item.userId,
    mealName: item.mealName,
    calories: item.calories,
    proteinGrams: item.proteinGrams,
    carbsGrams: item.carbsGrams,
    fatsGrams: item.fatsGrams,
    confidence: item.confidence,
    source: item.source as 'ai' | 'manual',
    confirmedByUser: item.confirmedByUser,
    photoPath: item.photoPath ?? undefined,
    consumedAt: item.consumedAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  }));

  const serverSets = serverSetLogs.map((item: WorkoutSetLog) => ({
    id: item.id,
    userId: item.userId,
    exerciseId: item.exerciseId,
    reps: item.reps,
    weightKg: item.weightKg,
    repRange: item.repRange,
    performedAt: item.performedAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  }));

  const mealConflicts = buildConflictMap(serverMeals, payload.mealLogs);
  const setConflicts = buildConflictMap(serverSets, payload.workoutSetLogs);

  if (payload.previewOnly) {
    res.status(200).json({
      strategy: 'conflict-preview',
      conflicts: {
        meals: mealConflicts,
        workoutSets: setConflicts
      }
    });
    return;
  }

  const forcedSource = new Map(payload.resolutions.map((resolution) => [resolution.id, resolution.source]));

  const mergedMeals = mergeLatest(
    serverMeals,
    payload.mealLogs.map((candidate) => {
      const source = forcedSource.get(candidate.id);
      if (source === 'server') {
        const server = serverMeals.find((entry: { id: string }) => entry.id === candidate.id);
        return server ?? candidate;
      }
      return candidate;
    })
  );

  const mergedSets = mergeLatest(
    serverSets,
    payload.workoutSetLogs.map((candidate) => {
      const source = forcedSource.get(candidate.id);
      if (source === 'server') {
        const server = serverSets.find((entry: { id: string }) => entry.id === candidate.id);
        return server ?? candidate;
      }
      return candidate;
    })
  );

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.mealLog.deleteMany({ where: { userId: payload.userId } });
    if (mergedMeals.length > 0) {
      await tx.mealLog.createMany({
        data: mergedMeals.map((item) => ({
          id: item.id,
          userId: item.userId,
          mealName: item.mealName,
          calories: item.calories,
          proteinGrams: item.proteinGrams,
          carbsGrams: item.carbsGrams,
          fatsGrams: item.fatsGrams,
          confidence: item.confidence,
          source: item.source,
          confirmedByUser: item.confirmedByUser,
          photoPath: item.photoPath,
          consumedAt: new Date(item.consumedAt),
          updatedAt: new Date(item.updatedAt)
        }))
      });
    }

    await tx.workoutSetLog.deleteMany({ where: { userId: payload.userId } });
    if (mergedSets.length > 0) {
      await tx.workoutSetLog.createMany({
        data: mergedSets.map((item) => ({
          id: item.id,
          userId: item.userId,
          exerciseId: item.exerciseId,
          reps: item.reps,
          weightKg: item.weightKg,
          repRange: item.repRange,
          performedAt: new Date(item.performedAt),
          updatedAt: new Date(item.updatedAt)
        }))
      });
    }
  });

  res.status(200).json({
    mealLogs: mergedMeals,
    workoutSetLogs: mergedSets,
    strategy: 'latest-edit-with-conflict-preview',
    unresolvedConflicts: {
      meals: mealConflicts.length,
      workoutSets: setConflicts.length
    }
  });
}));
