import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, Input, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { enqueueOfflineAction } from '../sync/offlineQueue';
import { colors, spacing, typography } from '../theme';
import type { MealEstimateResponse } from '../types';

interface EditableMeal {
  mealName: string;
  calories: string;
  proteinGrams: string;
  carbsGrams: string;
  fatsGrams: string;
}

interface MealTrackerScreenProps {
  onSuccess?: () => void;
}

export function MealTrackerScreen({ onSuccess }: MealTrackerScreenProps) {
  const { userId } = useAuth();
  const [photoHint, setPhotoHint] = useState('chicken rice');
  const [result, setResult] = useState('');
  const [resultVariant, setResultVariant] = useState<'success' | 'info' | 'warning' | 'error'>('info');
  const [pendingMeal, setPendingMeal] = useState<MealEstimateResponse | null>(null);
  const [editableMeal, setEditableMeal] = useState<EditableMeal | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const syncMealLog = async (payload: Record<string, unknown>) => {
    try {
      await apiFetch('/meals/logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setResult(`✓ Meal logged: ${payload.mealName as string}`);
      setResultVariant('success');
      onSuccess?.();
    } catch {
      const queueSize = await enqueueOfflineAction({ type: 'MEAL_LOG', payload });
      setResult(`You're offline — meal queued for sync (${queueSize} pending).`);
      setResultVariant('warning');
    }
  };

  const analyze = async () => {
    if (!userId) return;
    if (loading) return;

    try {
      setResult('');
      setLoading(true);

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
        setResult(`Low confidence (${Math.round(estimate.confidence * 100)}%). Please review the details before saving.`);
        setResultVariant('warning');
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
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Could not analyze the meal. Please try again.');
      setResultVariant('error');
    } finally {
      setLoading(false);
    }
  };

  const confirmMeal = async () => {
    if (!userId || !pendingMeal || !editableMeal) return;
    if (confirmLoading) return;

    try {
      setConfirmLoading(true);
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
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track a Meal</Text>
      <Text style={styles.subtitle}>Describe or hint at your meal and we'll estimate the macros.</Text>

      <Input
        label="Meal description"
        value={photoHint}
        onChangeText={setPhotoHint}
        placeholder="e.g. chicken rice bowl"
        helperText="Be as specific as possible for a better estimate."
      />

      {!!result && <StatusMessage variant={resultVariant} message={result} />}

      {editableMeal ? (
        <Card variant="default" padding="md">
          <Text style={styles.confirmTitle}>Review & confirm meal</Text>
          <Text style={styles.confirmSubtitle}>Adjust any values before saving.</Text>
          <View style={styles.confirmForm}>
            <Input
              label="Meal name"
              value={editableMeal.mealName}
              onChangeText={(value) => setEditableMeal({ ...editableMeal, mealName: value })}
            />
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Input
                  label="Calories"
                  value={editableMeal.calories}
                  onChangeText={(value) => setEditableMeal({ ...editableMeal, calories: value })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.macroItem}>
                <Input
                  label="Protein (g)"
                  value={editableMeal.proteinGrams}
                  onChangeText={(value) => setEditableMeal({ ...editableMeal, proteinGrams: value })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Input
                  label="Carbs (g)"
                  value={editableMeal.carbsGrams}
                  onChangeText={(value) => setEditableMeal({ ...editableMeal, carbsGrams: value })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.macroItem}>
                <Input
                  label="Fats (g)"
                  value={editableMeal.fatsGrams}
                  onChangeText={(value) => setEditableMeal({ ...editableMeal, fatsGrams: value })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Button
              label={confirmLoading ? 'Saving…' : 'Confirm & Save Meal'}
              variant="primary"
              loading={confirmLoading}
              onPress={confirmMeal}
            />
            <Button
              label="Discard"
              variant="ghost"
              onPress={() => { setPendingMeal(null); setEditableMeal(null); setResult(''); }}
            />
          </View>
        </Card>
      ) : (
        <Button
          label={loading ? 'Analyzing…' : 'Analyze Meal'}
          variant="secondary"
          loading={loading}
          onPress={analyze}
          disabled={!userId}
          accessibilityLabel="Analyze meal macros"
        />
      )}

      {!userId && (
        <Text style={styles.hint}>Sign in to start tracking meals.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['4'],
    marginBottom: spacing['5'],
  },
  title: {
    color: colors.text,
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.size.md,
    marginTop: -spacing['2'],
  },
  confirmTitle: {
    color: colors.text,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing['1'],
  },
  confirmSubtitle: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginBottom: spacing['3'],
  },
  confirmForm: {
    gap: spacing['3'],
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  macroItem: {
    flex: 1,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
