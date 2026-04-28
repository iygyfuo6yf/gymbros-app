import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Input, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography } from '../theme';
import type { AuthResponse } from '../types';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('bro@example.com');
  const [name, setName] = useState('Gym Bro');
  const [idToken, setIdToken] = useState('google-test-token-local-dev');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async (provider: 'google' | 'apple') => {
    if (loading) return;
    try {
      setError('');
      setLoading(true);
      const response = await apiFetch<AuthResponse>('/auth/social', {
        method: 'POST',
        body: JSON.stringify({ provider, idToken, email, name })
      });
      await setAuth(response.user.id, response.session);
      onSuccess?.();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Sign-in failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Hero brand area ── */}
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoEmoji}>💪</Text>
        </View>
        <Text style={styles.brand}>GymBros</Text>
        <Text style={styles.tagline}>Your personal strength companion</Text>
      </View>

      {/* ── Value proposition pills ── */}
      <View style={styles.pillRow}>
        {['Track lifts', 'Log meals', 'See trends'].map((label) => (
          <View key={label} style={styles.pill}>
            <Text style={styles.pillText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── Sign-in form ── */}
      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          required
        />
        <Input
          label="Display name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          autoComplete="name"
        />
        <Input
          label="ID Token (dev)"
          value={idToken}
          onChangeText={setIdToken}
          placeholder="Google / Apple ID token"
          helperText="In production this is provided by the OAuth flow."
          autoCapitalize="none"
        />
      </View>

      {!!error && <StatusMessage variant="error" message={error} />}

      <View style={styles.actions}>
        <Button
          label={loading ? 'Signing in…' : 'Continue with Google'}
          variant="secondary"
          loading={loading}
          onPress={() => signIn('google')}
          accessibilityLabel="Sign in with Google"
        />
        <Button
          label="Continue with Apple"
          variant="outline"
          disabled={loading}
          onPress={() => signIn('apple')}
          accessibilityLabel="Sign in with Apple"
        />
      </View>

      <Text style={styles.legal}>
        By continuing you agree to our Terms of Service and Privacy Policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['4'],
    marginBottom: spacing['5'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing['2'],
    paddingVertical: spacing['6'],
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['1'],
  },
  logoEmoji: {
    fontSize: 36,
  },
  brand: {
    color: colors.text,
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.extrabold,
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: typography.size.md,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['2'],
    marginTop: -spacing['2'],
  },
  pill: {
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  form: {
    gap: spacing['3'],
  },
  actions: {
    gap: spacing['2'],
  },
  legal: {
    fontSize: typography.size.xs,
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: typography.size.xs * typography.lineHeight.relaxed,
  },
});

