import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, Input, SectionHeader, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, minTapTarget, radius, spacing, typography } from '../theme';

interface OnboardingScreenProps {
  onSuccess?: () => void;
}

function validateAge(value: string): string | undefined {
  const n = Number(value);
  if (!value.trim()) return 'Age is required';
  if (isNaN(n) || n < 10 || n > 110) return 'Enter a valid age (10–110)';
}

function validateWeight(value: string): string | undefined {
  const n = Number(value);
  if (!value.trim()) return 'Weight is required';
  if (isNaN(n) || n < 20 || n > 400) return 'Enter a valid weight in kg (20–400)';
}

function validateHeight(value: string): string | undefined {
  const n = Number(value);
  if (!value.trim()) return 'Height is required';
  if (isNaN(n) || n < 50 || n > 280) return 'Enter a valid height in cm (50–280)';
}

type GoalKey = 'strength' | 'hypertrophy' | 'lose_fat' | 'maintain';
type ActivityKey = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const GOALS: { key: GoalKey; label: string; icon: string; desc: string }[] = [
  { key: 'strength', label: 'Build Strength', icon: '🏋️', desc: 'Lift heavier, hit PRs' },
  { key: 'hypertrophy', label: 'Gain Muscle', icon: '💪', desc: 'Bigger, fuller physique' },
  { key: 'lose_fat', label: 'Lose Fat', icon: '🔥', desc: 'Lean up, stay strong' },
  { key: 'maintain', label: 'Stay Fit', icon: '⚡', desc: 'Maintain & feel great' },
];

const ACTIVITY_LEVELS: { key: ActivityKey; label: string; desc: string }[] = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
  { key: 'light', label: 'Light', desc: '1–3 days/week active' },
  { key: 'moderate', label: 'Moderate', desc: '3–5 days/week active' },
  { key: 'active', label: 'Active', desc: '6–7 days/week active' },
  { key: 'very_active', label: 'Very Active', desc: 'Hard daily training' },
];

const GOAL_TO_API: Record<GoalKey, string> = {
  strength: 'bulk',
  hypertrophy: 'bulk',
  lose_fat: 'cut',
  maintain: 'maintain',
};

export function OnboardingScreen({ onSuccess }: OnboardingScreenProps) {
  const { userId } = useAuth();
  const [result, setResult] = useState('');
  const [age, setAge] = useState('22');
  const [weight, setWeight] = useState('78');
  const [height, setHeight] = useState('176');
  const [selectedGoal, setSelectedGoal] = useState<GoalKey>('strength');
  const [selectedActivity, setSelectedActivity] = useState<ActivityKey>('moderate');
  const [touched, setTouched] = useState({ age: false, weight: false, height: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ageError = touched.age ? validateAge(age) : undefined;
  const weightError = touched.weight ? validateWeight(weight) : undefined;
  const heightError = touched.height ? validateHeight(height) : undefined;
  const isFormValid = !validateAge(age) && !validateWeight(weight) && !validateHeight(height);

  const submit = async () => {
    setTouched({ age: true, weight: true, height: true });
    if (!userId) {
      setError('Please sign in first.');
      return;
    }
    if (!isFormValid) return;

    try {
      setError('');
      setLoading(true);
      await apiFetch('/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          age: Number(age),
          sex: 'male',
          weightKg: Number(weight),
          heightCm: Number(height),
          activityLevel: selectedActivity,
          goal: GOAL_TO_API[selectedGoal],
        })
      });

      const recommendations = await apiFetch<{ meals: Array<{ name: string }> }>(`/nutrition/recommendations/${userId}`);
      setResult(`Targets saved! Suggested meals: ${recommendations.meals.map((meal) => meal.name).join(', ')}`);
      onSuccess?.();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Set Your Goals"
        subtitle="We'll personalise your plan and daily nutrition targets."
      />

      {/* ── Goal type selector ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What's your primary goal?</Text>
        <View style={styles.goalGrid}>
          {GOALS.map((g) => {
            const active = g.key === selectedGoal;
            return (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalCard, active && styles.goalCardActive]}
                onPress={() => setSelectedGoal(g.key)}
                accessible
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={g.label}
              >
                <Text style={styles.goalIcon}>{g.icon}</Text>
                <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>{g.label}</Text>
                <Text style={[styles.goalDesc, active && styles.goalDescActive]}>{g.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Body stats ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your body stats</Text>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Input
              label="Age"
              value={age}
              onChangeText={setAge}
              onBlur={() => setTouched((prev) => ({ ...prev, age: true }))}
              keyboardType="numeric"
              placeholder="22"
              errorText={ageError}
              required
            />
          </View>
          <View style={styles.rowItem}>
            <Input
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              onBlur={() => setTouched((prev) => ({ ...prev, weight: true }))}
              keyboardType="numeric"
              placeholder="78"
              errorText={weightError}
              required
            />
          </View>
          <View style={styles.rowItem}>
            <Input
              label="Height (cm)"
              value={height}
              onChangeText={setHeight}
              onBlur={() => setTouched((prev) => ({ ...prev, height: true }))}
              keyboardType="numeric"
              placeholder="176"
              errorText={heightError}
              required
            />
          </View>
        </View>
      </View>

      {/* ── Activity level ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Activity level</Text>
        <View style={styles.activityList}>
          {ACTIVITY_LEVELS.map((a) => {
            const active = a.key === selectedActivity;
            return (
              <TouchableOpacity
                key={a.key}
                style={[styles.activityRow, active && styles.activityRowActive]}
                onPress={() => setSelectedActivity(a.key)}
                accessible
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${a.label}: ${a.desc}`}
              >
                <View style={[styles.activityRadio, active && styles.activityRadioActive]}>
                  {active && <View style={styles.activityRadioDot} />}
                </View>
                <View style={styles.activityText}>
                  <Text style={[styles.activityLabel, active && styles.activityLabelActive]}>{a.label}</Text>
                  <Text style={styles.activityDesc}>{a.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {!!error && <StatusMessage variant="error" message={error} />}
      {!!result && (
        <Card variant="flat" padding="md">
          <StatusMessage variant="success" message={result} />
        </Card>
      )}

      <Button
        label={loading ? 'Calculating…' : 'Calculate My Targets'}
        variant="primary"
        size="lg"
        loading={loading}
        onPress={submit}
        disabled={!userId}
        accessibilityLabel="Calculate nutrition targets"
      />
      {!userId && (
        <Text style={styles.hint}>You need to sign in before setting goals.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['5'],
    marginBottom: spacing['5'],
  },
  section: {
    gap: spacing['3'],
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['2'],
  },
  goalCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing['3'],
    gap: spacing['1'],
    minHeight: minTapTarget,
  },
  goalCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.successBg,
  },
  goalIcon: {
    fontSize: 22,
  },
  goalLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  goalLabelActive: {
    color: colors.primary,
  },
  goalDesc: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
  },
  goalDescActive: {
    color: colors.successText,
  },
  row: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  rowItem: {
    flex: 1,
  },
  activityList: {
    gap: spacing['2'],
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing['3'],
    minHeight: minTapTarget,
  },
  activityRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.successBg,
  },
  activityRadio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityRadioActive: {
    borderColor: colors.primary,
  },
  activityRadioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  activityText: {
    flex: 1,
    gap: spacing['0'],
  },
  activityLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  activityLabelActive: {
    color: colors.primary,
  },
  activityDesc: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

