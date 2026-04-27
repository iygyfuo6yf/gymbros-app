import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const gymsRouter = Router();

gymsRouter.get('/recommended', asyncHandler(async (_req, res) => {
  const gyms = await prisma.gym.findMany({
    orderBy: [
      { promoted: 'desc' },
      { rating: 'desc' }
    ],
    take: 5
  });

  res.status(200).json(gyms);
}));
