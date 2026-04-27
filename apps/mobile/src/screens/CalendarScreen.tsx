import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { enqueueOfflineAction } from '../sync/offlineQueue';
import { colors, spacing, typography } from '../theme';

interface TrendPoint {
  date: string;
  volumeKg: number;
  estimated1RM: number;
  adherencePct: number | null;
}

interface CalendarScreenProps {
  onSuccess?: () => void;
}

export function CalendarScreen({ onSuccess }: CalendarScreenProps) {
  const { userId } = useAuth();
  const [summary, setSummary] = useState('');
  const [trendSummary, setTrendSummary] = useState('');
  const [conflicts, setConflicts] = useState<Array<{ id: string }>>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    if (!userId || loadingProgress) return;

    try {
      setError('');
      setLoadingProgress(true);
      const response = await apiFetch<{ streak: number; totalWorkouts: number; totalMealsLogged: number }>(`/calendar/summary/${userId}`);
      setSummary(`🔥 ${response.streak}-day streak · ${response.totalWorkouts} workouts · ${response.totalMealsLogged} meals logged`);

      const trend = await apiFetch<{ points: TrendPoint[] }>(`/calendar/trends/${userId}`);
      const last = trend.points.at(-1);
      if (!last) {
        setTrendSummary('No trend data yet — log a workout to get started!');
        return;
      }

      const adherence = last.adherencePct ?? 0;
      const bar = '█'.repeat(Math.max(1, Math.min(10, Math.round(adherence / 10))));
      setTrendSummary(`Volume ${last.volumeKg} kg · 1RM ${last.estimated1RM} kg · Nutrition ${adherence}%  ${bar}`);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load progress. Please try again.');
    } finally {
      setLoadingProgress(false);
    }
  };

  const previewConflicts = async () => {
    if (!userId || loadingConflicts) return;

    const payload = {
      userId,
      previewOnly: true,
      mealLogs: [],
      workoutSetLogs: []
    };

    try {
      setLoadingConflicts(true);
      const response = await apiFetch<{ conflicts: { meals: Array<{ id: string }>; workoutSets: Array<{ id: string }> } }>('/sync', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setConflicts([...response.conflicts.meals, ...response.conflicts.workoutSets]);
    } catch {
      await enqueueOfflineAction({ type: 'SYNC_PAYLOAD', payload: { ...payload, previewOnly: false } });
    } finally {
      setLoadingConflicts(false);
    }
  };

  const applyConflictPreference = async (source: 'client' | 'server') => {
    if (!userId || conflicts.length === 0) return;

    await apiFetch('/sync', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        mealLogs: [],
        workoutSetLogs: [],
        resolutions: conflicts.map((item) => ({ id: item.id, source }))
      })
    });

    setSummary(`Resolved ${conflicts.length} conflict(s) using ${source === 'client' ? 'your phone' : 'server'} version`);
    setConflicts([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      <Text style={styles.subtitle}>Track your streak, trends, and overall consistency.</Text>

      {!!error && <StatusMessage variant="error" message={error} />}

      {!summary && !trendSummary && !error && (
        <Card variant="flat" padding="md">
          <Text style={styles.emptyText}>No data loaded yet.</Text>
          <Text style={styles.emptySubtext}>Tap the button below to load your progress summary.</Text>
        </Card>
      )}

      {!!summary && (
        <Card variant="default" padding="md">
          <Text style={styles.statText}>{summary}</Text>
        </Card>
      )}

      {!!trendSummary && (
        <Card variant="flat" padding="md">
          <Text style={styles.trendLabel}>Latest trend</Text>
          <Text style={styles.trendText}>{trendSummary}</Text>
        </Card>
      )}

      <Button
        label={loadingProgress ? 'Loading…' : 'Refresh Progress'}
        variant="secondary"
        loading={loadingProgress}
        onPress={loadSummary}
        disabled={!userId}
        accessibilityLabel="Refresh progress summary"
      />

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Data sync</Text>
      <Button
        label={loadingConflicts ? 'Checking…' : 'Check Sync Conflicts'}
        variant="outline"
        loading={loadingConflicts}
        onPress={previewConflicts}
        disabled={!userId}
        accessibilityLabel="Preview sync conflicts"
      />

      {conflicts.length > 0 ? (
        <Card variant="default" padding="md">
          <StatusMessage variant="warning" message={`${conflicts.length} conflict(s) need your choice`} />
          <View style={styles.conflictActions}>
            <Button
              label="Keep my phone changes"
              variant="primary"
              onPress={() => applyConflictPreference('client')}
              accessibilityLabel="Keep client-side changes"
            />
            <Button
              label="Keep server changes"
              variant="outline"
              onPress={() => applyConflictPreference('server')}
              accessibilityLabel="Keep server-side changes"
            />
          </View>
        </Card>
      ) : null}

      {!userId && (
        <Text style={styles.hint}>Sign in to view your progress.</Text>
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
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
    marginBottom: spacing['1'],
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  statText: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
  trendLabel: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginBottom: spacing['1'],
  },
  trendText: {
    color: colors.infoText,
    fontSize: typography.size.md,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing['1'],
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  conflictActions: {
    gap: spacing['2'],
    marginTop: spacing['3'],
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
