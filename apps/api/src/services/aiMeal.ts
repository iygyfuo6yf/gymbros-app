interface Estimate {
  mealName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  confidence: number;
}

const heuristics: Record<string, Omit<Estimate, 'confidence'>> = {
  chicken: { mealName: 'Chicken Meal', calories: 520, proteinGrams: 42, carbsGrams: 38, fatsGrams: 18 },
  salad: { mealName: 'Protein Salad', calories: 390, proteinGrams: 30, carbsGrams: 22, fatsGrams: 17 },
  burger: { mealName: 'Burger Meal', calories: 740, proteinGrams: 34, carbsGrams: 58, fatsGrams: 40 }
};

export function estimateFromPhotoHint(hint: string): Estimate {
  const normalizedHint = hint.toLowerCase();
  const key = Object.keys(heuristics).find((candidate) => normalizedHint.includes(candidate));
  const base = key ? heuristics[key] : { mealName: 'Mixed Meal', calories: 560, proteinGrams: 30, carbsGrams: 55, fatsGrams: 22 };
  const confidence = key ? 0.82 : 0.58;

  return {
    ...base,
    confidence
  };
}
