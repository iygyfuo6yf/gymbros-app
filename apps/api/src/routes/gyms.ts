import { Router } from 'express';
import { store } from '../lib/store.js';

export const gymsRouter = Router();

gymsRouter.get('/recommended', (_req, res) => {
  const gyms = store.gyms
    .slice()
    .sort((a, b) => Number(b.promoted) - Number(a.promoted) || b.rating - a.rating)
    .slice(0, 5);

  res.status(200).json(gyms);
});
