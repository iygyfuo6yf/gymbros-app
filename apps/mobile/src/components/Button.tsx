import React from 'react';
import {
  AccessibilityRole,
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, minTapTarget, radius, spacing, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  size = 'md',
  disabled,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[variant],
    isDisabled && styles.disabled,
    fullWidth && styles.fullWidth,
    size === 'sm' && styles.sizeSm,
    size === 'lg' && styles.sizeLg,
  ];

  const textStyle = [
    styles.label,
    styles[`${variant}Label` as keyof typeof styles],
    isDisabled && styles.disabledLabel,
    size === 'sm' && styles.labelSm,
    size === 'lg' && styles.labelLg,
  ];

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      accessible
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.text}
          />
          <Text style={[...textStyle, styles.loadingLabel]}>{label}</Text>
        </View>
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTapTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Labels
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  primaryLabel: {
    color: colors.textInverse,
  },
  secondaryLabel: {
    color: colors.text,
  },
  dangerLabel: {
    color: colors.text,
  },
  ghostLabel: {
    color: colors.primary,
  },
  outlineLabel: {
    color: colors.text,
  },
  disabledLabel: {
    color: colors.textDisabled,
  },

  // Sizes
  sizeSm: {
    minHeight: 36,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderRadius: radius.sm,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: spacing['6'],
    paddingVertical: spacing['4'],
    borderRadius: radius.lg,
  },
  labelSm: {
    fontSize: typography.size.sm,
  },
  labelLg: {
    fontSize: typography.size.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  loadingLabel: {
    marginLeft: spacing['1'],
  },
});
