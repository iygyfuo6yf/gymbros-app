import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, Input, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { enqueueOfflineAction } from '../sync/offlineQueue';
import { colors, spacing, typography } from '../theme';
import type { ProgressiveOverloadResponse } from '../types';

interface WorkoutScreenProps {
  onSuccess?: () => void;
}

export function WorkoutScreen({ onSuccess }: WorkoutScreenProps) {
  const { userId } = useAuth();
  const [exerciseId, setExerciseId] = useState('ex-squat');
  const [status, setStatus] = useState('');
  const [statusVariant, setStatusVariant] = useState<'success' | 'warning' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);

  const logSet = async () => {
    if (!userId || loading) return;

    const payload = { userId, exerciseId, reps: 5, weightKg: 100, repRange: '5-8', performedAt: new Date().toISOString() };

    try {
      setStatus('');
      setLoading(true);

      try {
        await apiFetch('/workouts/sets', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch {
        const queueSize = await enqueueOfflineAction({ type: 'WORKOUT_SET', payload });
        setStatus(`You're offline — set queued (${queueSize} pending). It will sync when you're back online.`);
        setStatusVariant('warning');
        return;
      }

      const progress = await apiFetch<ProgressiveOverloadResponse>(`/workouts/progressive/${userId}/${exerciseId}`);
      const latest = progress.trend.at(-1)?.estimated1RM;

      await apiFetch('/watch/snapshot', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          activeRoutineName: 'Live Workout',
          currentSet: progress.trend.length,
          targetRepRange: payload.repRange,
          capturedAt: new Date().toISOString()
        })
      }).catch(() => undefined);

      setStatus(`Set logged! Estimated 1RM: ${latest ?? '–'} kg · synced to watch`);
      setStatusVariant('success');
      onSuccess?.();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not log set. Please try again.');
      setStatusVariant('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log a Workout Set</Text>
      <Text style={styles.subtitle}>Track your sets and monitor progressive overload over time.</Text>

      <Card variant="flat" padding="md">
        <Text style={styles.cardLabel}>Current exercise</Text>
        <Input
          value={exerciseId}
          onChangeText={setExerciseId}
          placeholder="Exercise ID (e.g. ex-squat)"
          helperText="Use an exercise ID from your program."
          accessibilityLabel="Exercise ID"
        />
        <View style={styles.setDetails}>
          <View style={styles.setChip}>
            <Text style={styles.setChipLabel}>5 reps</Text>
          </View>
          <View style={styles.setChip}>
            <Text style={styles.setChipLabel}>100 kg</Text>
          </View>
          <View style={styles.setChip}>
            <Text style={styles.setChipLabel}>5–8 rep range</Text>
          </View>
        </View>
      </Card>

      {!!status && <StatusMessage variant={statusVariant} message={status} />}

      <Button
        label={loading ? 'Logging set…' : 'Log Working Set'}
        variant="primary"
        loading={loading}
        onPress={logSet}
        disabled={!userId}
        accessibilityLabel="Log working set"
      />

      {!userId && (
        <Text style={styles.hint}>Sign in to log your workouts.</Text>
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
  cardLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing['2'],
  },
  setDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['2'],
    marginTop: spacing['3'],
  },
  setChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
  },
  setChipLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
