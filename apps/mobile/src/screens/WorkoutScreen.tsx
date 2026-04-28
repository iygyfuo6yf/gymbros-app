import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, Input, SectionHeader, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { enqueueOfflineAction } from '../sync/offlineQueue';
import { colors, minTapTarget, radius, spacing, typography } from '../theme';
import type { ProgressiveOverloadResponse } from '../types';

interface WorkoutScreenProps {
  onSuccess?: () => void;
}

const QUICK_EXERCISES = [
  { id: 'ex-squat', label: 'Squat', icon: '🦵' },
  { id: 'ex-bench', label: 'Bench', icon: '🏋️' },
  { id: 'ex-deadlift', label: 'Deadlift', icon: '💀' },
  { id: 'ex-ohp', label: 'OHP', icon: '⬆️' },
];

export function WorkoutScreen({ onSuccess }: WorkoutScreenProps) {
  const { userId } = useAuth();
  const [exerciseId, setExerciseId] = useState('ex-squat');
  const [reps, setReps] = useState(5);
  const [weightKg, setWeightKg] = useState(100);
  const [status, setStatus] = useState('');
  const [statusVariant, setStatusVariant] = useState<'success' | 'warning' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);
  const [loggedSets, setLoggedSets] = useState<{ reps: number; weightKg: number; estimated1RM?: number }[]>([]);

  const adjustReps = (delta: number) => setReps((v) => Math.max(1, v + delta));
  const adjustWeight = (delta: number) => setWeightKg((v) => Math.max(0, v + delta));

  const logSet = async () => {
    if (!userId || loading) return;

    const payload = {
      userId,
      exerciseId,
      reps,
      weightKg,
      repRange: '3-8',
      performedAt: new Date().toISOString(),
    };

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
        setLoggedSets((prev) => [...prev, { reps, weightKg }]);
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

      setLoggedSets((prev) => [...prev, { reps, weightKg, estimated1RM: latest }]);
      setStatus(`Set ${loggedSets.length + 1} logged!${latest !== undefined ? `  Est. 1RM: ${latest} kg` : ''}`);
      setStatusVariant('success');
      onSuccess?.();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not log set. Please try again.');
      setStatusVariant('error');
    } finally {
      setLoading(false);
    }
  };

  const selectedExercise = QUICK_EXERCISES.find((e) => e.id === exerciseId);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Log a Set"
        subtitle="Track sets and watch your progressive overload over time."
      />

      {/* ── Quick exercise selector ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Exercise</Text>
        <View style={styles.quickRow}>
          {QUICK_EXERCISES.map((ex) => {
            const active = ex.id === exerciseId;
            return (
              <TouchableOpacity
                key={ex.id}
                style={[styles.quickChip, active && styles.quickChipActive]}
                onPress={() => setExerciseId(ex.id)}
                accessible
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={ex.label}
              >
                <Text style={styles.quickChipIcon}>{ex.icon}</Text>
                <Text style={[styles.quickChipLabel, active && styles.quickChipLabelActive]}>{ex.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Input
          value={exerciseId}
          onChangeText={setExerciseId}
          placeholder="Exercise ID (e.g. ex-squat)"
          helperText="Or type a custom exercise ID from your program."
          accessibilityLabel="Exercise ID"
        />
      </View>

      {/* ── Set parameters ── */}
      <Card variant="default" padding="md">
        <Text style={styles.cardLabel}>
          {selectedExercise ? `${selectedExercise.icon} ${selectedExercise.label}` : exerciseId}
        </Text>

        <View style={styles.paramRow}>
          {/* Reps stepper */}
          <View style={styles.paramBlock}>
            <Text style={styles.paramLabel}>Reps</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustReps(-1)}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Decrease reps"
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{reps}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustReps(1)}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Increase reps"
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.paramDivider} />

          {/* Weight stepper */}
          <View style={styles.paramBlock}>
            <Text style={styles.paramLabel}>Weight (kg)</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustWeight(-2.5)}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Decrease weight by 2.5 kg"
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{weightKg}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustWeight(2.5)}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Increase weight by 2.5 kg"
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>

      {/* ── Logged sets history ── */}
      {loggedSets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sets logged this session</Text>
          {loggedSets.map((s, i) => (
            <View key={i} style={styles.setRow}>
              <View style={styles.setNumber}>
                <Text style={styles.setNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.setInfo}>{s.reps} reps × {s.weightKg} kg</Text>
              {s.estimated1RM !== undefined && (
                <Text style={styles.setEstimate}>Est. 1RM {s.estimated1RM} kg</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {!!status && <StatusMessage variant={statusVariant} message={status} />}

      <Button
        label={loading ? 'Logging set…' : `Log Set${loggedSets.length > 0 ? ` #${loggedSets.length + 1}` : ''}`}
        variant="primary"
        size="lg"
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
  section: {
    gap: spacing['2'],
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  quickChip: {
    flex: 1,
    alignItems: 'center',
    gap: spacing['1'],
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing['2'],
    minHeight: minTapTarget,
    justifyContent: 'center',
  },
  quickChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.successBg,
  },
  quickChipIcon: {
    fontSize: 18,
  },
  quickChipLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
  },
  quickChipLabelActive: {
    color: colors.primary,
  },
  cardLabel: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing['3'],
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  paramBlock: {
    flex: 1,
    alignItems: 'center',
    gap: spacing['2'],
  },
  paramDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },
  paramLabel: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: colors.text,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    lineHeight: 22,
  },
  stepValue: {
    color: colors.text,
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    minWidth: 44,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'],
  },
  setNumber: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    color: colors.text,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  setInfo: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  setEstimate: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

