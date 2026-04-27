import React from 'react';
import {
  AccessibilityRole,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
}

export function Input({
  label,
  helperText,
  errorText,
  required,
  style,
  ...rest
}: InputProps) {
  const hasError = !!errorText;

  return (
    <View style={styles.container} accessibilityRole={'none' as AccessibilityRole}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        accessible
        accessibilityLabel={label}
        accessibilityHint={helperText}
        style={[
          styles.input,
          hasError && styles.inputError,
          style,
        ]}
      />
      {hasError ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['1'],
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.surface2,
    color: colors.text,
    fontSize: typography.size.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['3'],
    minHeight: 44,
  },
  inputError: {
    borderColor: colors.error,
  },
  helperText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: typography.size.xs,
    color: colors.error,
  },
});
