import { z } from 'zod';

export const sanitizedString = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const sanitizedId = () => sanitizedString(1, 128);

export const isoDateTime = () => z.string().datetime();
