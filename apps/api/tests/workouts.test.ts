import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { resetStore } from './test-utils.js';

describe('workout routine logging and progression', () => {
  beforeEach(async () => {
    await resetStore();
  });

  it('creates routine and returns progression trend after set logs', async () => {
    const signIn = await request(app)
      .post('/auth/social')
      .send({
        provider: 'google',
        idToken: 'google-test-token-workouts',
        email: 'bro@example.com',
        name: 'Gym Bro'
      })
      .expect(200);

    const userId = signIn.body.user.id as string;

    const routineResponse = await request(app)
      .post('/workouts/routines')
      .send({
        userId,
        name: 'Push Day',
        exercises: [{ exerciseId: 'ex-bench', repRange: '6-10' }]
      })
      .expect(201);

    expect(routineResponse.body.name).toBe('Push Day');

    await request(app)
      .post('/workouts/sets')
      .send({
        userId,
        exerciseId: 'ex-bench',
        reps: 6,
        weightKg: 80,
        repRange: '6-10',
        performedAt: '2026-01-01T10:00:00.000Z'
      })
      .expect(201);

    const progressResponse = await request(app)
      .get(`/workouts/progressive/${userId}/ex-bench`)
      .expect(200);

    expect(progressResponse.body.logs).toHaveLength(1);
    expect(progressResponse.body.trend[0].estimated1RM).toBeGreaterThan(90);
  });
});
