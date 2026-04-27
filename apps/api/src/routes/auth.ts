import { Router } from 'express';
import { z } from 'zod';
import { issueSessionTokens, rotateRefreshToken } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { sanitizedString } from '../lib/validation.js';
import { validateSocialToken } from '../services/socialAuth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const bodySchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: sanitizedString(8, 4096),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  name: sanitizedString(1, 80).optional()
}).strict();

const refreshSchema = z.object({
  refreshToken: sanitizedString(20, 4096)
}).strict();

export const authRouter = Router();

authRouter.post('/social', asyncHandler(async (req, res) => {
  const payload = bodySchema.parse(req.body);
  const providerProfile = await validateSocialToken(payload.provider, payload.idToken);

  const email = (providerProfile.email ?? payload.email ?? '').trim().toLowerCase();
  const name = (payload.name ?? providerProfile.name ?? 'GymBros User').trim();

  let user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email || `${providerProfile.subject}@${payload.provider}.gymbros.local`,
        name,
        provider: payload.provider,
        providerSubject: providerProfile.subject
      }
    });
  }

  const tokens = await issueSessionTokens(user.id);
  res.status(200).json({ user, session: tokens });
}));

authRouter.post('/refresh', asyncHandler(async (req, res) => {
  const payload = refreshSchema.parse(req.body);
  const session = await rotateRefreshToken(payload.refreshToken);
  res.status(200).json({ session });
}));
