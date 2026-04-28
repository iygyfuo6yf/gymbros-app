import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, SectionHeader, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { enqueueOfflineAction } from '../sync/offlineQueue';
import { colors, radius, spacing, typography } from '../theme';

interface TrendPoint {
  date: string;
  volumeKg: number;
  estimated1RM: number;
  adherencePct: number | null;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  accent?: string;
}

function StatCard({ label, value, icon, accent = colors.primary }: StatCardProps) {
  return (
    <View style={[statCardStyles.card, { borderTopColor: accent }]}>
      <Text style={statCardStyles.icon}>{icon}</Text>
      <Text style={[statCardStyles.value, { color: accent }]}>{value}</Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    padding: spacing['3'],
    alignItems: 'center',
    gap: spacing['1'],
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.extrabold,
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

interface CalendarScreenProps {
  onSuccess?: () => void;
}

export function CalendarScreen({ onSuccess }: CalendarScreenProps) {
  const { userId } = useAuth();
  const [streak, setStreak] = useState<number | null>(null);
  const [totalWorkouts, setTotalWorkouts] = useState<number | null>(null);
  const [totalMeals, setTotalMeals] = useState<number | null>(null);
  const [trendPoint, setTrendPoint] = useState<TrendPoint | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ id: string }>>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  const loadSummary = async () => {
    if (!userId || loadingProgress) return;

    try {
      setError('');
      setLoadingProgress(true);
      const response = await apiFetch<{ streak: number; totalWorkouts: number; totalMealsLogged: number }>(`/calendar/summary/${userId}`);
      setStreak(response.streak);
      setTotalWorkouts(response.totalWorkouts);
      setTotalMeals(response.totalMealsLogged);

      const trend = await apiFetch<{ points: TrendPoint[] }>(`/calendar/trends/${userId}`);
      const last = trend.points.at(-1);
      setTrendPoint(last ?? null);
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

    setSyncMessage(`Resolved ${conflicts.length} conflict(s) using ${source === 'client' ? 'your phone' : 'server'} version`);
    setConflicts([]);
  };

  const hasData = streak !== null || totalWorkouts !== null;
  const adherence = trendPoint?.adherencePct ?? 0;
  const adherenceBarWidth = Math.max(2, Math.min(100, adherence));

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Your Progress"
        subtitle="Streak, volume trends, and nutrition consistency."
      />

      {!!error && <StatusMessage variant="error" message={error} />}

      {/* ── Empty state ── */}
      {!hasData && !error && (
        <Card variant="flat" padding="md">
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No data loaded yet</Text>
            <Text style={styles.emptySubtext}>Tap "Refresh Progress" below to see your stats.</Text>
          </View>
        </Card>
      )}

      {/* ── Stat cards row ── */}
      {hasData && (
        <View style={styles.statRow}>
          <StatCard label="Day streak" value={`${streak ?? 0}`} icon="🔥" accent={colors.warning} />
          <StatCard label="Workouts" value={`${totalWorkouts ?? 0}`} icon="🏋️" accent={colors.primary} />
          <StatCard label="Meals logged" value={`${totalMeals ?? 0}`} icon="🥗" accent={colors.secondary} />
        </View>
      )}

      {/* ── Trend snapshot ── */}
      {trendPoint && (
        <Card variant="default" padding="md">
          <Text style={styles.trendTitle}>Latest trend snapshot</Text>
          <View style={styles.trendMetrics}>
            <View style={styles.trendMetric}>
              <Text style={styles.trendMetricValue}>{trendPoint.volumeKg} kg</Text>
              <Text style={styles.trendMetricLabel}>Volume</Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendMetric}>
              <Text style={styles.trendMetricValue}>{trendPoint.estimated1RM} kg</Text>
              <Text style={styles.trendMetricLabel}>Est. 1RM</Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendMetric}>
              <Text style={[styles.trendMetricValue, { color: adherence >= 80 ? colors.success : adherence >= 50 ? colors.warning : colors.error }]}>
                {adherence}%
              </Text>
              <Text style={styles.trendMetricLabel}>Nutrition</Text>
            </View>
          </View>

          {/* Adherence bar */}
          <View style={styles.adherenceSection}>
            <View style={styles.adherenceLabelRow}>
              <Text style={styles.adherenceLabel}>Nutrition adherence</Text>
              <Text style={styles.adherencePct}>{adherence}%</Text>
            </View>
            <View style={styles.adherenceTrack}>
              <View
                style={[
                  styles.adherenceFill,
                  {
                    width: `${adherenceBarWidth}%`,
                    backgroundColor: adherence >= 80 ? colors.success : adherence >= 50 ? colors.warning : colors.error,
                  },
                ]}
              />
            </View>
          </View>
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

      {!!syncMessage && <StatusMessage variant="success" message={syncMessage} />}

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
  emptyState: {
    alignItems: 'center',
    gap: spacing['2'],
    paddingVertical: spacing['4'],
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  trendTitle: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing['3'],
  },
  trendMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['4'],
  },
  trendMetric: {
    flex: 1,
    alignItems: 'center',
    gap: spacing['1'],
  },
  trendMetricValue: {
    color: colors.text,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  trendMetricLabel: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
  },
  trendDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  adherenceSection: {
    gap: spacing['2'],
  },
  adherenceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adherenceLabel: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
  },
  adherencePct: {
    color: colors.textSecondary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  adherenceTrack: {
    height: 8,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  adherenceFill: {
    height: '100%',
    borderRadius: radius.full,
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

