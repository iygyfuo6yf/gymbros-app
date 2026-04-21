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

const MIN_DAILY_CALORIES = 1400;
const CALORIES_PER_GRAM_PROTEIN = 4;
const CALORIES_PER_GRAM_CARBS = 4;
const CALORIES_PER_GRAM_FAT = 9;
const MIN_CARBS_GRAMS = 60;
const PROTEIN_MULTIPLIER_BULK = 2.0;
const PROTEIN_MULTIPLIER_NON_BULK = 2.2;

export function calculateTargets(input: Pick<NutritionProfile, 'age' | 'sex' | 'weightKg' | 'heightCm' | 'activityLevel' | 'goal'>) {
  const bmr = input.sex === 'male'
    ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5
    : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161;

  const calories = Math.max(MIN_DAILY_CALORIES, Math.round(bmr * activityMultiplier[input.activityLevel] + goalAdjustment[input.goal]));
  const proteinGrams = Math.round(input.weightKg * (input.goal === 'bulk' ? PROTEIN_MULTIPLIER_BULK : PROTEIN_MULTIPLIER_NON_BULK));
  const fatsGrams = Math.round((calories * 0.25) / CALORIES_PER_GRAM_FAT);
  const carbsGrams = Math.max(
    MIN_CARBS_GRAMS,
    Math.round((calories - (proteinGrams * CALORIES_PER_GRAM_PROTEIN + fatsGrams * CALORIES_PER_GRAM_FAT)) / CALORIES_PER_GRAM_CARBS)
  );

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
