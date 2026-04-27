export type Provider = 'google' | 'apple';

export interface User {
  id: string;
  email: string;
  name: string;
  provider: Provider;
  providerSubject: string;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionProfile {
  userId: string;
  age: number;
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  activityLevel: 'low' | 'moderate' | 'high';
  goal: 'cut' | 'maintain' | 'bulk';
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  updatedAt: string;
}

export interface MealRecommendation {
  id: string;
  name: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

export interface MealLog {
  id: string;
  userId: string;
  mealName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  confidence: number;
  source: 'ai' | 'manual';
  confirmedByUser: boolean;
  photoPath?: string;
  consumedAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  goal: 'general' | 'strength' | 'hypertrophy';
}

export interface RoutineExercise {
  exerciseId: string;
  repRange: string;
}

export interface WorkoutRoutine {
  id: string;
  userId: string;
  name: string;
  exercises: RoutineExercise[];
  updatedAt: string;
}

export interface WorkoutSetLog {
  id: string;
  userId: string;
  exerciseId: string;
  reps: number;
  weightKg: number;
  repRange: string;
  performedAt: string;
  updatedAt: string;
}

export interface Gym {
  id: string;
  name: string;
  city: string;
  promoted: boolean;
  rating: number;
}

export interface RoutineTemplate {
  id: string;
  goal: 'strength' | 'hypertrophy';
  name: string;
  exercises: RoutineExercise[];
}

export interface SyncPayload {
  mealLogs: MealLog[];
  workoutSetLogs: WorkoutSetLog[];
}
