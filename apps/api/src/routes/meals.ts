import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/apiError.js';
import { mealAnalysisRateLimiter } from '../lib/rateLimit.js';
import { isoDateTime, sanitizedId, sanitizedString } from '../lib/validation.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { analyzeMealWithModel } from '../services/vlmMeal.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const analyzeSchema = z.object({
  photoHint: sanitizedString(2, 200).optional(),
  photoUploadId: sanitizedId().optional()
}).strict();

const uploadSchema = z.object({
  userId: sanitizedId(),
  fileName: sanitizedString(3, 120),
  mimeType: sanitizedString(3, 100),
  base64Data: z.string().min(20).max(5_000_000)
}).strict();

const logSchema = z.object({
  userId: sanitizedId(),
  mealName: sanitizedString(1, 100),
  calories: z.number().int().min(0),
  proteinGrams: z.number().min(0),
  carbsGrams: z.number().min(0),
  fatsGrams: z.number().min(0),
  confidence: z.number().min(0).max(1),
  source: z.enum(['ai', 'manual']),
  confirmedByUser: z.boolean().default(false),
  photoPath: sanitizedString(1, 255).optional(),
  consumedAt: isoDateTime()
}).strict();

export const mealsRouter = Router();

mealsRouter.post('/uploads', asyncHandler(async (req, res) => {
  const payload = uploadSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const uploadsDir = path.resolve(process.cwd(), env.UPLOADS_DIR);
  await mkdir(uploadsDir, { recursive: true });
  const extension = payload.fileName.includes('.') ? payload.fileName.slice(payload.fileName.lastIndexOf('.')) : '.jpg';
  const savedFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
  const savedPath = path.join(uploadsDir, savedFileName);
  await writeFile(savedPath, Buffer.from(payload.base64Data, 'base64'));

  const photo = await prisma.mealPhoto.create({
    data: {
      userId: payload.userId,
      path: savedPath,
      mimeType: payload.mimeType,
      sizeBytes: Buffer.byteLength(payload.base64Data, 'base64')
    }
  });

  res.status(201).json(photo);
}));

mealsRouter.post('/analyze', mealAnalysisRateLimiter, asyncHandler(async (req, res) => {
  const payload = analyzeSchema.parse(req.body);
  const photo = payload.photoUploadId
    ? await prisma.mealPhoto.findUnique({ where: { id: payload.photoUploadId } })
    : null;

  const estimate = await analyzeMealWithModel({
    photoHint: payload.photoHint,
    photoPath: photo?.path
  });

  res.status(200).json({
    ...estimate,
    photoPath: photo?.path,
    needsConfirmation: estimate.confidence < 0.7
  });
}));

mealsRouter.post('/logs', asyncHandler(async (req, res) => {
  const payload = logSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (payload.source === 'ai' && payload.confidence < 0.7 && !payload.confirmedByUser) {
    throw new AppError(400, 'MEAL_CONFIRMATION_REQUIRED', 'Low-confidence AI meals must be user-confirmed before saving');
  }

  const meal = await prisma.mealLog.create({
    data: {
      userId: payload.userId,
      mealName: payload.mealName,
      calories: payload.calories,
      proteinGrams: payload.proteinGrams,
      carbsGrams: payload.carbsGrams,
      fatsGrams: payload.fatsGrams,
      confidence: payload.confidence,
      source: payload.source,
      confirmedByUser: payload.confirmedByUser,
      photoPath: payload.photoPath,
      consumedAt: new Date(payload.consumedAt)
    }
  });

  res.status(201).json({ ...meal, consumedAt: meal.consumedAt.toISOString(), updatedAt: meal.updatedAt.toISOString() });
}));

mealsRouter.put('/logs/:id', asyncHandler(async (req, res) => {
  const payload = logSchema.partial().strict().parse(req.body);
  const existing = await prisma.mealLog.findUnique({ where: { id: req.params.id } });

  if (!existing) {
    throw new AppError(404, 'MEAL_NOT_FOUND', 'Meal log not found');
  }

  const meal = await prisma.mealLog.update({
    where: { id: req.params.id },
    data: {
      ...(payload.mealName ? { mealName: payload.mealName } : {}),
      ...(payload.calories !== undefined ? { calories: payload.calories } : {}),
      ...(payload.proteinGrams !== undefined ? { proteinGrams: payload.proteinGrams } : {}),
      ...(payload.carbsGrams !== undefined ? { carbsGrams: payload.carbsGrams } : {}),
      ...(payload.fatsGrams !== undefined ? { fatsGrams: payload.fatsGrams } : {}),
      ...(payload.confidence !== undefined ? { confidence: payload.confidence } : {}),
      ...(payload.source ? { source: payload.source } : {}),
      ...(payload.confirmedByUser !== undefined ? { confirmedByUser: payload.confirmedByUser } : {}),
      ...(payload.photoPath ? { photoPath: payload.photoPath } : {}),
      ...(payload.consumedAt ? { consumedAt: new Date(payload.consumedAt) } : {})
    }
  });

  res.status(200).json({ ...meal, consumedAt: meal.consumedAt.toISOString(), updatedAt: meal.updatedAt.toISOString() });
}));

mealsRouter.get('/logs/:userId', asyncHandler(async (req, res) => {
  const logs = await prisma.mealLog.findMany({
    where: { userId: req.params.userId },
    orderBy: { consumedAt: 'desc' }
  });

  res.status(200).json(logs.map((item) => ({ ...item, consumedAt: item.consumedAt.toISOString(), updatedAt: item.updatedAt.toISOString() })));
}));
