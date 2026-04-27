import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { MealEstimateResponse } from '../types';
import { enqueueOfflineAction } from '../sync/offlineQueue';

interface EditableMeal {
  mealName: string;
  calories: string;
  proteinGrams: string;
  carbsGrams: string;
  fatsGrams: string;
}

export function MealTrackerScreen() {
  const { userId } = useAuth();
  const [photoHint, setPhotoHint] = useState('chicken rice');
  const [result, setResult] = useState('');
  const [pendingMeal, setPendingMeal] = useState<MealEstimateResponse | null>(null);
  const [editableMeal, setEditableMeal] = useState<EditableMeal | null>(null);

  const syncMealLog = async (payload: Record<string, unknown>) => {
    try {
      await apiFetch('/meals/logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setResult(`Logged ${payload.mealName as string}`);
    } catch {
      const queueSize = await enqueueOfflineAction({ type: 'MEAL_LOG', payload });
      setResult(`Offline: meal queued for sync (${queueSize} pending).`);
    }
  };

  const analyze = async () => {
    if (!userId) return;

    const upload = await apiFetch<{ id: string; path: string }>('/meals/uploads', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        fileName: 'meal.jpg',
        mimeType: 'image/jpeg',
        base64Data: 'aW1hZ2UtYnl0ZXMtaW1hZ2UtYnl0ZXMtaW1hZ2UtYnl0ZXMtaW1hZ2UtYnl0ZXM='
      })
    });

    const estimate = await apiFetch<MealEstimateResponse>('/meals/analyze', {
      method: 'POST',
      body: JSON.stringify({ photoHint, photoUploadId: upload.id })
    });

    if (estimate.needsConfirmation) {
      setPendingMeal(estimate);
      setEditableMeal({
        mealName: estimate.mealName,
        calories: `${estimate.calories}`,
        proteinGrams: `${estimate.proteinGrams}`,
        carbsGrams: `${estimate.carbsGrams}`,
        fatsGrams: `${estimate.fatsGrams}`
      });
      setResult(`Low confidence (${Math.round(estimate.confidence * 100)}%). Please review before saving.`);
      return;
    }

    await syncMealLog({
      userId,
      mealName: estimate.mealName,
      calories: estimate.calories,
      proteinGrams: estimate.proteinGrams,
      carbsGrams: estimate.carbsGrams,
      fatsGrams: estimate.fatsGrams,
      confidence: estimate.confidence,
      source: 'ai',
      confirmedByUser: false,
      photoPath: estimate.photoPath,
      consumedAt: new Date().toISOString()
    });
  };

  const confirmMeal = async () => {
    if (!userId || !pendingMeal || !editableMeal) return;

    await syncMealLog({
      userId,
      mealName: editableMeal.mealName,
      calories: Number(editableMeal.calories),
      proteinGrams: Number(editableMeal.proteinGrams),
      carbsGrams: Number(editableMeal.carbsGrams),
      fatsGrams: Number(editableMeal.fatsGrams),
      confidence: pendingMeal.confidence,
      source: 'ai',
      confirmedByUser: true,
      photoPath: pendingMeal.photoPath,
      consumedAt: new Date().toISOString()
    });

    setPendingMeal(null);
    setEditableMeal(null);
  };

  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>3) AI Calorie Tracker</Text>
      <TextInput value={photoHint} onChangeText={setPhotoHint} style={{ backgroundColor: '#1f2937', color: 'white', padding: 10 }} placeholder="Meal photo hint" />
      <Pressable onPress={analyze} style={{ backgroundColor: '#7c3aed', padding: 12 }}><Text style={{ color: 'white' }}>Analyze Meal Photo</Text></Pressable>

      {editableMeal ? (
        <View style={{ backgroundColor: '#111827', padding: 10, gap: 6 }}>
          <Text style={{ color: '#ddd6fe', fontWeight: '600' }}>Manual confirmation required</Text>
          <TextInput value={editableMeal.mealName} onChangeText={(value) => setEditableMeal({ ...editableMeal, mealName: value })} style={{ backgroundColor: '#1f2937', color: 'white', padding: 8 }} />
          <TextInput value={editableMeal.calories} onChangeText={(value) => setEditableMeal({ ...editableMeal, calories: value })} keyboardType="numeric" style={{ backgroundColor: '#1f2937', color: 'white', padding: 8 }} />
          <TextInput value={editableMeal.proteinGrams} onChangeText={(value) => setEditableMeal({ ...editableMeal, proteinGrams: value })} keyboardType="numeric" style={{ backgroundColor: '#1f2937', color: 'white', padding: 8 }} />
          <TextInput value={editableMeal.carbsGrams} onChangeText={(value) => setEditableMeal({ ...editableMeal, carbsGrams: value })} keyboardType="numeric" style={{ backgroundColor: '#1f2937', color: 'white', padding: 8 }} />
          <TextInput value={editableMeal.fatsGrams} onChangeText={(value) => setEditableMeal({ ...editableMeal, fatsGrams: value })} keyboardType="numeric" style={{ backgroundColor: '#1f2937', color: 'white', padding: 8 }} />
          <Pressable onPress={confirmMeal} style={{ backgroundColor: '#22c55e', padding: 10 }}><Text style={{ color: '#052e16' }}>Confirm + Save Meal</Text></Pressable>
        </View>
      ) : null}

      {!!result && <Text style={{ color: '#ddd6fe' }}>{result}</Text>}
    </View>
  );
}
