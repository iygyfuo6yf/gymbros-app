import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { resetStore } from './test-utils.js';

async function createUser() {
  const signIn = await request(app)
    .post('/auth/social')
    .send({
      provider: 'google',
      idToken: 'google-test-token-meals-user',
      email: 'meals@example.com',
      name: 'Meals User'
    })
    .expect(200);

  return signIn.body.user.id as string;
}

describe('meal AI analysis', () => {
  beforeEach(async () => {
    await resetStore();
  });

  it('flags low-confidence estimates for confirmation', async () => {
    const response = await request(app)
      .post('/meals/analyze')
      .send({ photoHint: 'unknown homemade dish' })
      .expect(200);

    expect(response.body.needsConfirmation).toBe(true);
    expect(response.body.confidence).toBeLessThan(0.7);
  });

  it('requires confirmation before logging low-confidence AI meal', async () => {
    const userId = await createUser();
    const estimate = await request(app)
      .post('/meals/analyze')
      .send({ photoHint: 'unknown homemade dish' })
      .expect(200);

    await request(app)
      .post('/meals/logs')
      .send({
        userId,
        mealName: estimate.body.mealName,
        calories: estimate.body.calories,
        proteinGrams: estimate.body.proteinGrams,
        carbsGrams: estimate.body.carbsGrams,
        fatsGrams: estimate.body.fatsGrams,
        confidence: estimate.body.confidence,
        source: 'ai',
        confirmedByUser: false,
        consumedAt: new Date().toISOString()
      })
      .expect(400);

    await request(app)
      .post('/meals/logs')
      .send({
        userId,
        mealName: estimate.body.mealName,
        calories: estimate.body.calories,
        proteinGrams: estimate.body.proteinGrams,
        carbsGrams: estimate.body.carbsGrams,
        fatsGrams: estimate.body.fatsGrams,
        confidence: estimate.body.confidence,
        source: 'ai',
        confirmedByUser: true,
        consumedAt: new Date().toISOString()
      })
      .expect(201);
  });
});
