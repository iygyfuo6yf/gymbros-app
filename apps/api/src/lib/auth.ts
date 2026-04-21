import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const secret = env.JWT_SECRET;

export function createSessionTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId, scope: 'access' }, secret, { expiresIn: '30m' });
  const refreshToken = jwt.sign({ sub: userId, scope: 'refresh' }, secret, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}
