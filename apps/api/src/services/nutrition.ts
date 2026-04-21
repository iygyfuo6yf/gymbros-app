import { sampleMealsSeed } from '../seed/data.js';
import type { MealRecommendation, NutritionProfile } from '../types/models.js';

const activityMultiplier = {
  low: 1.35,
  moderate: 1.55,
  high: 1.75
} as const;

const goalAdjustment = {
  cut: -350,
  maintain: 0,
  bulk: 300
} as const;

export function calculateTargets(input: Pick<NutritionProfile, 'age' | 'sex' | 'weightKg' | 'heightCm' | 'activityLevel' | 'goal'>) {
  const bmr = input.sex === 'male'
    ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5
    : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161;

  const calories = Math.max(1400, Math.round(bmr * activityMultiplier[input.activityLevel] + goalAdjustment[input.goal]));
  const proteinGrams = Math.round(input.weightKg * (input.goal === 'bulk' ? 2.0 : 2.2));
  const fatsGrams = Math.round((calories * 0.25) / 9);
  const carbsGrams = Math.max(60, Math.round((calories - (proteinGrams * 4 + fatsGrams * 9)) / 4));

  return {
    dailyCalories: calories,
    proteinGrams,
    carbsGrams,
    fatsGrams
  };
}

export function recommendMeals(profile: NutritionProfile): MealRecommendation[] {
  const targetPerMeal = profile.dailyCalories / 3;
  return sampleMealsSeed
    .slice()
    .sort((a, b) => Math.abs(a.calories - targetPerMeal) - Math.abs(b.calories - targetPerMeal))
    .slice(0, 3);
}
