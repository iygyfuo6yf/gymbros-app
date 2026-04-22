import { env } from '../config/env.js';
import { estimateFromPhotoHint } from './aiMeal.js';

interface AnalyzeInput {
  photoHint?: string;
  photoPath?: string;
}

interface AnalyzeOutput {
  mealName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  confidence: number;
  model: 'heuristic' | 'vlm';
}

export async function analyzeMealWithModel(input: AnalyzeInput): Promise<AnalyzeOutput> {
  if (env.NUTRITION_VLM_API_URL) {
    const response = await fetch(env.NUTRITION_VLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.NUTRITION_VLM_API_KEY ? { Authorization: `Bearer ${env.NUTRITION_VLM_API_KEY}` } : {})
      },
      body: JSON.stringify({ photoPath: input.photoPath, photoHint: input.photoHint })
    });

    if (response.ok) {
      const body = await response.json() as AnalyzeOutput;
      return { ...body, model: 'vlm' };
    }
  }

  const fallback = estimateFromPhotoHint(input.photoHint ?? 'unknown meal');
  return {
    ...fallback,
    model: 'heuristic'
  };
}
