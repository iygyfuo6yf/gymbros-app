import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { resetStore } from './test-utils.js';

describe('auth social sign-in', () => {
  beforeEach(async () => {
    await resetStore();
  });

  it('creates a session for valid Google sign-in and rotates refresh token', async () => {
    const response = await request(app)
      .post('/auth/social')
      .send({
        provider: 'google',
        idToken: 'google-test-token-valid-signin',
        email: 'Bro@Example.com',
        name: ' Gym Bro '
      })
      .expect(200);

    expect(response.body.user.email).toBe('bro@example.com');
    expect(response.body.user.name).toBe('Gym Bro');
    expect(typeof response.body.session.accessToken).toBe('string');
    expect(typeof response.body.session.refreshToken).toBe('string');

    const rotated = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: response.body.session.refreshToken })
      .expect(200);

    expect(rotated.body.session.refreshToken).not.toBe(response.body.session.refreshToken);
  });

  it('returns validation error for invalid payload', async () => {
    const response = await request(app)
      .post('/auth/social')
      .send({
        provider: 'google',
        idToken: 'short',
        email: 'not-an-email',
        name: '',
        extra: 'blocked'
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('Request validation failed');
  });
});
