import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface ProgressStepsProps {
  steps: string[];
  current: number;
}

export function ProgressSteps({ steps, current }: ProgressStepsProps) {
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;

  return (
    <View style={styles.container} accessible accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}>
      {/* Bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>

      {/* Step labels */}
      <View style={styles.labelsRow}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done ? (
                  <Text style={styles.dotCheck}>✓</Text>
                ) : (
                  <Text style={[styles.dotNum, active && styles.dotNumActive]}>{index + 1}</Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, done && styles.stepLabelDone, active && styles.stepLabelActive]}
                numberOfLines={1}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['2'],
  },
  barTrack: {
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    gap: spacing['1'],
    flex: 1,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  dotNum: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.semibold,
  },
  dotNumActive: {
    color: colors.primary,
  },
  dotCheck: {
    fontSize: typography.size.xs,
    color: colors.textInverse,
    fontWeight: typography.weight.bold,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: colors.primary,
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: typography.weight.semibold,
  },
});
