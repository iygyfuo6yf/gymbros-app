import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { MealEstimateResponse } from '../types';

export function MealTrackerScreen() {
  const { userId } = useAuth();
  const [photoHint, setPhotoHint] = useState('chicken rice');
  const [result, setResult] = useState('');

  const analyze = async () => {
    if (!userId) return;

    const estimate = await apiFetch<MealEstimateResponse>('/meals/analyze', {
      method: 'POST',
      body: JSON.stringify({ photoHint })
    });

    await apiFetch('/meals/logs', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        mealName: estimate.mealName,
        calories: estimate.calories,
        proteinGrams: estimate.proteinGrams,
        carbsGrams: estimate.carbsGrams,
        fatsGrams: estimate.fatsGrams,
        confidence: estimate.confidence,
        source: 'ai',
        consumedAt: new Date().toISOString()
      })
    });

    setResult(estimate.needsConfirmation
      ? `Low confidence (${Math.round(estimate.confidence * 100)}%). Prompt user to edit values.`
      : `Logged ${estimate.mealName}: ${estimate.calories} kcal`);
  };

  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>3) AI Calorie Tracker</Text>
      <TextInput value={photoHint} onChangeText={setPhotoHint} style={{ backgroundColor: '#1f2937', color: 'white', padding: 10 }} placeholder="Meal photo hint" />
      <Pressable onPress={analyze} style={{ backgroundColor: '#7c3aed', padding: 12 }}><Text style={{ color: 'white' }}>Analyze + Log Meal</Text></Pressable>
      {!!result && <Text style={{ color: '#ddd6fe' }}>{result}</Text>}
    </View>
  );
}
