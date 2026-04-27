import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { resetStore } from './test-utils.js';

describe('sync conflict preview', () => {
  beforeEach(async () => {
    await resetStore();
  });

  it('returns conflict preview payload without mutating records', async () => {
    const signIn = await request(app)
      .post('/auth/social')
      .send({
        provider: 'google',
        idToken: 'google-test-token-sync',
        email: 'sync@example.com',
        name: 'Sync User'
      })
      .expect(200);

    const userId = signIn.body.user.id as string;

    const meal = await request(app)
      .post('/meals/logs')
      .send({
        userId,
        mealName: 'Rice Bowl',
        calories: 600,
        proteinGrams: 35,
        carbsGrams: 70,
        fatsGrams: 15,
        confidence: 0.9,
        source: 'manual',
        confirmedByUser: true,
        consumedAt: '2026-01-01T10:00:00.000Z'
      })
      .expect(201);

    const preview = await request(app)
      .post('/sync')
      .send({
        userId,
        previewOnly: true,
        mealLogs: [{
          id: meal.body.id,
          userId,
          mealName: meal.body.mealName,
          calories: 700
          ,
          proteinGrams: meal.body.proteinGrams,
          carbsGrams: meal.body.carbsGrams,
          fatsGrams: meal.body.fatsGrams,
          confidence: meal.body.confidence,
          source: meal.body.source,
          confirmedByUser: meal.body.confirmedByUser,
          consumedAt: meal.body.consumedAt,
          updatedAt: meal.body.updatedAt
        }],
        workoutSetLogs: []
      })
      .expect(200);

    expect(preview.body.strategy).toBe('conflict-preview');
    expect(preview.body.conflicts.meals).toHaveLength(1);
  });
});
