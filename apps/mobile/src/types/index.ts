export interface Session {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: { id: string; email: string; name: string };
  session: Session;
}

export interface MealEstimateResponse {
  mealName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  confidence: number;
  needsConfirmation: boolean;
}

export interface ProgressiveOverloadResponse {
  trend: Array<{ estimated1RM: number }>;
}
