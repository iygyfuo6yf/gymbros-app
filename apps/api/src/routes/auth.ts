import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { createSessionTokens } from '../lib/auth.js';
import { store } from '../lib/store.js';
import { sanitizedString } from '../lib/validation.js';

const bodySchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: sanitizedString(8, 4096),
  email: z.string().trim().toLowerCase().email().max(254),
  name: sanitizedString(1, 80)
}).strict();

export const authRouter = Router();

authRouter.post('/social', (req, res) => {
  const payload = bodySchema.parse(req.body);

  let user = store.users.find((candidate) => candidate.email === payload.email);

  if (!user) {
    user = {
      id: uuid(),
      email: payload.email,
      name: payload.name,
      provider: payload.provider,
      providerSubject: payload.idToken.slice(0, 12),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.users.push(user);
  }

  const tokens = createSessionTokens(user.id);
  res.status(200).json({ user, session: tokens });
});
