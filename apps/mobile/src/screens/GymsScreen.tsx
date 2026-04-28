import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, SectionHeader, StatusMessage } from '../components';
import { colors, radius, spacing, typography } from '../theme';

interface Gym {
  name: string;
  promoted: boolean;
  rating: number;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={starStyles.row}>
      {Array.from({ length: 5 }, (_, i) => (
        <Text key={i} style={[starStyles.star, { opacity: i < full || (i === full && half) ? 1 : 0.25 }]}>
          ★
        </Text>
      ))}
      <Text style={starStyles.score}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    color: colors.warning,
    fontSize: 13,
  },
  score: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing['1'],
  },
});

export function GymsScreen() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (loading) return;
    try {
      setError('');
      setLoading(true);
      const response = await apiFetch<Gym[]>('/gyms/recommended');
      setGyms(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load gyms. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recommended Gyms"
        subtitle="Top-rated gyms near you, updated weekly."
      />

      {!!error && (
        <>
          <StatusMessage variant="error" message={error} />
          <Button
            label="Try again"
            variant="outline"
            onPress={load}
            accessibilityLabel="Retry loading gyms"
          />
        </>
      )}

      {gyms.length === 0 && loading && (
        <Card variant="flat" padding="md">
          <Text style={styles.emptyText}>Finding gyms near you…</Text>
        </Card>
      )}

      {gyms.length === 0 && !loading && !error && (
        <Card variant="flat" padding="md">
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏟️</Text>
            <Text style={styles.emptyText}>No gyms found</Text>
            <Text style={styles.emptySubtext}>Tap below to search for top-rated gyms in your area.</Text>
          </View>
        </Card>
      )}

      {gyms.map((gym, index) => (
        <TouchableOpacity
          key={gym.name}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${gym.name}, rated ${gym.rating.toFixed(1)} stars${gym.promoted ? ', featured' : ''}`}
          activeOpacity={0.8}
        >
          <Card variant="default" padding="md">
            <View style={styles.gymRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.gymInfo}>
                {gym.promoted && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>⭐ Featured</Text>
                  </View>
                )}
                <Text style={styles.gymName}>{gym.name}</Text>
                <StarRating rating={gym.rating} />
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {gyms.length > 0 && (
        <Button
          label={loading ? 'Refreshing…' : 'Refresh'}
          variant="ghost"
          size="sm"
          loading={loading}
          onPress={load}
          accessibilityLabel="Refresh gym recommendations"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['3'],
    marginBottom: spacing['5'],
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing['2'],
    paddingVertical: spacing['3'],
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankText: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  gymInfo: {
    flex: 1,
    gap: spacing['1'],
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
  },
  featuredText: {
    color: colors.warningText,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  gymName: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
});

