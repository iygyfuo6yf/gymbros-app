import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export function createSessionTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId, scope: 'access' }, secret, { expiresIn: '30m' });
  const refreshToken = jwt.sign({ sub: userId, scope: 'refresh' }, secret, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}
