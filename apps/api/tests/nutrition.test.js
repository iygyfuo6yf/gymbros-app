import { describe, expect, it } from 'vitest';
import { calculateTargets } from '../src/services/nutrition.js';
describe('calculateTargets', () => {
    it('calculates realistic macros for moderate male maintaining', () => {
        const targets = calculateTargets({
            age: 24,
            sex: 'male',
            weightKg: 80,
            heightCm: 178,
            activityLevel: 'moderate',
            goal: 'maintain'
        });
        expect(targets.dailyCalories).toBeGreaterThan(2200);
        expect(targets.proteinGrams).toBeGreaterThanOrEqual(160);
        expect(targets.carbsGrams).toBeGreaterThan(100);
        expect(targets.fatsGrams).toBeGreaterThan(50);
    });
});
