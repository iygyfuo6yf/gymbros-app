import { gymsSeed, exerciseLibrarySeed, sampleMealsSeed } from '../seed/data.js';
import type { Exercise, Gym, MealLog, MealRecommendation, NutritionProfile, User, WorkoutRoutine, WorkoutSetLog } from '../types/models.js';

export const store: {
  users: User[];
  profiles: NutritionProfile[];
  mealLogs: MealLog[];
  routines: WorkoutRoutine[];
  setLogs: WorkoutSetLog[];
  exercises: Exercise[];
  meals: MealRecommendation[];
  gyms: Gym[];
} = {
  users: [],
  profiles: [],
  mealLogs: [],
  routines: [],
  setLogs: [],
  exercises: exerciseLibrarySeed,
  meals: sampleMealsSeed,
  gyms: gymsSeed
};
