import type { Exercise, Gym, MealRecommendation, RoutineTemplate } from '../types/models.js';

export const exerciseLibrarySeed: Exercise[] = [
  { id: 'ex-squat', name: 'Barbell Back Squat', muscleGroup: 'legs', equipment: 'barbell', goal: 'strength' },
  { id: 'ex-bench', name: 'Barbell Bench Press', muscleGroup: 'chest', equipment: 'barbell', goal: 'strength' },
  { id: 'ex-row', name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable', goal: 'hypertrophy' },
  { id: 'ex-ohp', name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell', goal: 'strength' },
  { id: 'ex-curl', name: 'Dumbbell Curl', muscleGroup: 'arms', equipment: 'dumbbell', goal: 'hypertrophy' },
  { id: 'ex-rdl', name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell', goal: 'strength' },
  { id: 'ex-incline-db', name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell', goal: 'hypertrophy' },
  { id: 'ex-lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable', goal: 'hypertrophy' },
  { id: 'ex-leg-press', name: 'Leg Press', muscleGroup: 'legs', equipment: 'machine', goal: 'hypertrophy' },
  { id: 'ex-deadlift', name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell', goal: 'strength' }
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

export const routineTemplatesSeed: RoutineTemplate[] = [
  {
    id: 'tpl-strength-a',
    goal: 'strength',
    name: 'Strength A (Squat + Bench)',
    exercises: [
      { exerciseId: 'ex-squat', repRange: '3-5' },
      { exerciseId: 'ex-bench', repRange: '3-5' },
      { exerciseId: 'ex-row', repRange: '5-8' }
    ]
  },
  {
    id: 'tpl-hypertrophy-a',
    goal: 'hypertrophy',
    name: 'Hypertrophy Upper',
    exercises: [
      { exerciseId: 'ex-incline-db', repRange: '8-12' },
      { exerciseId: 'ex-lat-pulldown', repRange: '10-12' },
      { exerciseId: 'ex-curl', repRange: '10-15' }
    ]
  }
];
