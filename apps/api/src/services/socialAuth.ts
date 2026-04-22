import { createHash, createPublicKey, verify as verifySignature } from 'crypto';
import { AppError } from '../lib/apiError.js';
import { env } from '../config/env.js';

interface ProviderProfile {
  subject: string;
  email?: string;
  name?: string;
}

interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: Buffer;
  signingInput: string;
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

function parseJwt(token: string): JwtParts {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Token is not a valid JWT');
  }

  return {
    header: JSON.parse(fromBase64Url(encodedHeader).toString('utf8')),
    payload: JSON.parse(fromBase64Url(encodedPayload).toString('utf8')),
    signature: fromBase64Url(encodedSignature),
    signingInput: `${encodedHeader}.${encodedPayload}`
  };
}

function toSha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function validateGoogleTokenStrict(idToken: string): Promise<ProviderProfile> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Google token validation failed');
  }

  const payload = await response.json() as Record<string, string>;
  if (!payload.sub) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Google token missing subject');
  }

  if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Google token audience mismatch');
  }

  if (payload.email_verified !== 'true') {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Google account email is not verified');
  }

  return {
    subject: payload.sub,
    email: payload.email,
    name: payload.name
  };
}

async function validateAppleTokenStrict(idToken: string): Promise<ProviderProfile> {
  const parts = parseJwt(idToken);
  if (parts.header.alg !== 'RS256' || typeof parts.header.kid !== 'string') {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Apple token algorithm/key id is invalid');
  }

  const jwksResponse = await fetch('https://appleid.apple.com/auth/keys');
  if (!jwksResponse.ok) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Unable to load Apple signing keys');
  }
  const jwks = await jwksResponse.json() as { keys: Array<Record<string, string>> };
  const key = jwks.keys.find((candidate) => candidate.kid === parts.header.kid);
  if (!key) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Apple signing key not found');
  }

  const publicKey = createPublicKey({ key, format: 'jwk' });
  const isValidSignature = verifySignature('RSA-SHA256', Buffer.from(parts.signingInput), publicKey, parts.signature);
  if (!isValidSignature) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Apple token signature is invalid');
  }

  const issuer = `${parts.payload.iss ?? ''}`;
  if (issuer !== 'https://appleid.apple.com') {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Apple token issuer mismatch');
  }

  const audience = `${parts.payload.aud ?? ''}`;
  if (env.APPLE_SERVICE_ID && audience !== env.APPLE_SERVICE_ID) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Apple token audience mismatch');
  }

  const exp = Number(parts.payload.exp ?? 0) * 1000;
  if (!exp || exp < Date.now()) {
    throw new AppError(401, 'INVALID_SOCIAL_TOKEN', 'Apple token is expired');
  }

  return {
    subject: `${parts.payload.sub ?? ''}`,
    email: typeof parts.payload.email === 'string' ? parts.payload.email : undefined
  };
}

export async function validateSocialToken(provider: 'google' | 'apple', idToken: string): Promise<ProviderProfile> {
  if (env.SOCIAL_TOKEN_VALIDATION_MODE === 'test' || env.NODE_ENV === 'test') {
    if (!idToken.startsWith(`${provider}-test-token-`)) {
      throw new AppError(401, 'INVALID_SOCIAL_TOKEN', `${provider} test token format mismatch`);
    }

    return {
      subject: toSha256(idToken).slice(0, 24)
    };
  }

  if (provider === 'google') {
    return validateGoogleTokenStrict(idToken);
  }

  return validateAppleTokenStrict(idToken);
}
