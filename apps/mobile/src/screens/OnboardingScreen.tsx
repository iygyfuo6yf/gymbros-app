import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Card, Input, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';

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

export function OnboardingScreen({ onSuccess }: OnboardingScreenProps) {
  const { userId } = useAuth();
  const [result, setResult] = useState('');
  const [age, setAge] = useState('22');
  const [weight, setWeight] = useState('78');
  const [height, setHeight] = useState('176');
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
        body: JSON.stringify({ userId, age: Number(age), sex: 'male', weightKg: Number(weight), heightCm: Number(height), activityLevel: 'moderate', goal: 'maintain' })
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
      <Text style={styles.title}>Set Your Goals</Text>
      <Text style={styles.subtitle}>We'll calculate your daily targets based on your profile.</Text>

      <View style={styles.form}>
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

      {!!error && <StatusMessage variant="error" message={error} />}
      {!!result && (
        <Card variant="flat" padding="md">
          <StatusMessage variant="success" message={result} />
        </Card>
      )}

      <Button
        label={loading ? 'Calculating…' : 'Calculate My Targets'}
        variant="primary"
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
  form: {
    gap: spacing['3'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  rowItem: {
    flex: 1,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
