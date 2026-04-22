import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('health and readiness endpoints', () => {
  it('returns liveness status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body.status).toBe('live');
    expect(response.body.ok).toBe(true);
  });

  it('returns readiness status', async () => {
    const response = await request(app).get('/ready').expect(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.checks.env).toBe(true);
  });
});
