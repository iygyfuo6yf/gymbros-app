import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, StatusMessage } from '../components';
import { colors, spacing, typography } from '../theme';

interface Gym {
  name: string;
  promoted: boolean;
  rating: number;
}

export function GymsScreen() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
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
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended Gyms</Text>
      <Text style={styles.subtitle}>Discover top-rated gyms near you.</Text>

      {!!error && <StatusMessage variant="error" message={error} />}

      {gyms.length === 0 && !loading && !error && (
        <Card variant="flat" padding="md">
          <Text style={styles.emptyText}>No gyms loaded yet.</Text>
          <Text style={styles.emptySubtext}>Tap below to see top-rated gyms in your area.</Text>
        </Card>
      )}

      {gyms.map((gym) => (
        <Card key={gym.name} variant="default" padding="md">
          <View style={styles.gymRow}>
            <View style={styles.gymInfo}>
              {gym.promoted && <Text style={styles.badge}>⭐ Featured</Text>}
              <Text style={styles.gymName}>{gym.name}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{gym.rating.toFixed(1)}</Text>
            </View>
          </View>
        </Card>
      ))}

      <Button
        label={loading ? 'Loading…' : 'Load Recommended Gyms'}
        variant="secondary"
        loading={loading}
        onPress={load}
        accessibilityLabel="Load recommended gyms"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['3'],
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
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gymInfo: {
    flex: 1,
    gap: spacing['1'],
  },
  badge: {
    color: colors.warning,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  gymName: {
    color: colors.text,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
  ratingBadge: {
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    marginLeft: spacing['2'],
  },
  ratingText: {
    color: colors.text,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
});
