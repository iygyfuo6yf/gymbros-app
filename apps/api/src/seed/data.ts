import type { Exercise, Gym, MealRecommendation } from '../types/models.js';

export const exerciseLibrarySeed: Exercise[] = [
  { id: 'ex-squat', name: 'Barbell Back Squat', muscleGroup: 'legs', equipment: 'barbell' },
  { id: 'ex-bench', name: 'Barbell Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { id: 'ex-row', name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable' },
  { id: 'ex-ohp', name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell' },
  { id: 'ex-curl', name: 'Dumbbell Curl', muscleGroup: 'arms', equipment: 'dumbbell' }
];

export const sampleMealsSeed: MealRecommendation[] = [
  { id: 'meal-1', name: 'Chicken Rice Bowl', calories: 620, proteinGrams: 45, carbsGrams: 72, fatsGrams: 16 },
  { id: 'meal-2', name: 'Salmon Sweet Potato Plate', calories: 540, proteinGrams: 38, carbsGrams: 48, fatsGrams: 20 },
  { id: 'meal-3', name: 'Greek Yogurt + Oats + Berries', calories: 430, proteinGrams: 30, carbsGrams: 52, fatsGrams: 10 },
  { id: 'meal-4', name: 'Lean Beef Wrap', calories: 510, proteinGrams: 36, carbsGrams: 44, fatsGrams: 18 }
];

export const gymsSeed: Gym[] = [
  { id: 'gym-1', name: 'Iron Forge Gym', city: 'Austin', promoted: true, rating: 4.8 },
  { id: 'gym-2', name: 'Downtown Strength Club', city: 'Austin', promoted: false, rating: 4.4 },
  { id: 'gym-3', name: 'Westside Fitness Hub', city: 'Austin', promoted: true, rating: 4.6 }
];
