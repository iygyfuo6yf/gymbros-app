import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from './apiError.js';
import { env } from '../config/env.js';
import { prisma } from './prisma.js';

const secret = env.JWT_SECRET;
const ACCESS_TTL_SECONDS = 30 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function signToken(payload: Record<string, string>, expiresInSeconds: number): string {
  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds });
}

export async function issueSessionTokens(userId: string, rotatedFromToken?: string) {
  const accessToken = signToken({ sub: userId, scope: 'access' }, ACCESS_TTL_SECONDS);
  const refreshToken = signToken({ sub: userId, scope: 'refresh', sid: randomUUID() }, REFRESH_TTL_SECONDS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
      rotatedFrom: rotatedFromToken ? hashToken(rotatedFromToken) : null
    }
  });

  if (rotatedFromToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rotatedFromToken), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(refreshToken: string) {
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, secret) as jwt.JwtPayload;
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid');
  }

  if (decoded.scope !== 'refresh' || typeof decoded.sub !== 'string') {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token scope is invalid');
  }

  const tokenRecord = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
  if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt.getTime() < Date.now()) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token has expired or was revoked');
  }

  return issueSessionTokens(decoded.sub, refreshToken);
}
