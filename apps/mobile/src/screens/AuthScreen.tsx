import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { Button, Input, StatusMessage } from '../components';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';
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
      <Text style={styles.title}>Welcome to GymBros</Text>
      <Text style={styles.subtitle}>Sign in to start your fitness journey</Text>

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
  actions: {
    gap: spacing['2'],
  },
});
