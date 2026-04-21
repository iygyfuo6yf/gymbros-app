import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { resetStore } from './test-utils.js';

describe('auth social sign-in', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a session for valid Google sign-in', async () => {
    const response = await request(app)
      .post('/auth/social')
      .send({
        provider: 'google',
        idToken: 'google-dev-valid-token',
        email: 'Bro@Example.com',
        name: ' Gym Bro '
      })
      .expect(200);

    expect(response.body.user.email).toBe('bro@example.com');
    expect(response.body.user.name).toBe('Gym Bro');
    expect(typeof response.body.session.accessToken).toBe('string');
    expect(typeof response.body.session.refreshToken).toBe('string');
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
