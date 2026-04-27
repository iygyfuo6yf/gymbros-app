import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ variant = 'default', padding = 'md', style, children, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        styles[variant],
        styles[`pad_${padding}` as keyof typeof styles],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  flat: {
    backgroundColor: colors.surface2,
  },
  pad_none: {
    padding: 0,
  },
  pad_sm: {
    padding: spacing['3'],
  },
  pad_md: {
    padding: spacing['4'],
  },
  pad_lg: {
    padding: spacing['6'],
  },
});
