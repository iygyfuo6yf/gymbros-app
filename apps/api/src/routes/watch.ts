import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { isoDateTime, sanitizedId, sanitizedString } from '../lib/validation.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const snapshotSchema = z.object({
  userId: sanitizedId(),
  activeRoutineName: sanitizedString(1, 100),
  currentSet: z.number().int().min(1),
  targetRepRange: sanitizedString(3, 20),
  capturedAt: isoDateTime().optional()
}).strict();

export const watchRouter = Router();

watchRouter.post('/snapshot', asyncHandler(async (req, res) => {
  const payload = snapshotSchema.parse(req.body);
  const snapshot = await prisma.watchWorkoutSnapshot.create({
    data: {
      userId: payload.userId,
      activeRoutineName: payload.activeRoutineName,
      currentSet: payload.currentSet,
      targetRepRange: payload.targetRepRange,
      capturedAt: payload.capturedAt ? new Date(payload.capturedAt) : new Date()
    }
  });

  res.status(201).json(snapshot);
}));

watchRouter.get('/snapshot/:userId', asyncHandler(async (req, res) => {
  const latest = await prisma.watchWorkoutSnapshot.findFirst({
    where: { userId: req.params.userId },
    orderBy: { capturedAt: 'desc' }
  });

  res.status(200).json(latest);
}));
