import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { store } from '../src/lib/store.js';
import { resetStore } from './test-utils.js';

describe('workout routine logging and progression', () => {
  beforeEach(() => {
    resetStore();
    store.users.push({
      id: 'user-1',
      email: 'bro@example.com',
      name: 'Gym Bro',
      provider: 'google',
      providerSubject: 'subject',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  it('creates routine and returns progression trend after set logs', async () => {
    const routineResponse = await request(app)
      .post('/workouts/routines')
      .send({
        userId: 'user-1',
        name: 'Push Day',
        exercises: [{ exerciseId: 'ex-bench', repRange: '6-10' }]
      })
      .expect(201);

    expect(routineResponse.body.name).toBe('Push Day');
    expect(routineResponse.body.exercises).toHaveLength(1);

    await request(app)
      .post('/workouts/sets')
      .send({
        userId: 'user-1',
        exerciseId: 'ex-bench',
        reps: 6,
        weightKg: 80,
        repRange: '6-10',
        performedAt: '2026-01-01T10:00:00.000Z'
      })
      .expect(201);

    await request(app)
      .post('/workouts/sets')
      .send({
        userId: 'user-1',
        exerciseId: 'ex-bench',
        reps: 6,
        weightKg: 85,
        repRange: '6-10',
        performedAt: '2026-01-10T10:00:00.000Z'
      })
      .expect(201);

    const progressionResponse = await request(app)
      .get('/workouts/progressive/user-1/ex-bench')
      .expect(200);

    expect(progressionResponse.body.trend).toHaveLength(2);
    expect(progressionResponse.body.trend[1].estimated1RM).toBeGreaterThan(
      progressionResponse.body.trend[0].estimated1RM
    );
  });
});
