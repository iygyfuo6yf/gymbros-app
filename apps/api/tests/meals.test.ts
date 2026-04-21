import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('meal AI analysis', () => {
  it('flags low-confidence estimates for confirmation', async () => {
    const response = await request(app)
      .post('/meals/analyze')
      .send({ photoHint: 'unknown homemade dish' })
      .expect(200);

    expect(response.body.needsConfirmation).toBe(true);
    expect(response.body.confidence).toBeLessThan(0.7);
  });
});
