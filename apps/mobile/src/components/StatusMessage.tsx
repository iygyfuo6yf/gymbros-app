import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export type StatusVariant = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  variant: StatusVariant;
  message: string;
}

const config: Record<StatusVariant, { bg: string; text: string; icon: string }> = {
  success: { bg: colors.successBg, text: colors.successText, icon: '✓' },
  error: { bg: colors.errorBg, text: colors.errorText, icon: '✕' },
  warning: { bg: colors.warningBg, text: colors.warningText, icon: '!' },
  info: { bg: colors.infoBg, text: colors.infoText, icon: 'i' },
};

export function StatusMessage({ variant, message }: StatusMessageProps) {
  const { bg, text, icon } = config[variant];

  return (
    <View
      style={[styles.container, { backgroundColor: bg }]}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={[styles.iconBadge, { backgroundColor: text }]}>
        <Text style={[styles.icon, { color: bg }]}>{icon}</Text>
      </View>
      <Text style={[styles.message, { color: text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['2'],
    borderRadius: radius.md,
    padding: spacing['3'],
  },
  iconBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  icon: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
  },
  message: {
    fontSize: typography.size.sm,
    flex: 1,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
});
