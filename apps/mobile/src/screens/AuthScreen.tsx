import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AuthResponse } from '../types';

export function AuthScreen() {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('bro@example.com');
  const [name, setName] = useState('Gym Bro');
  const [idToken, setIdToken] = useState('google-test-token-local-dev');
  const [error, setError] = useState('');

  const signIn = async (provider: 'google' | 'apple') => {
    try {
      setError('');
      const response = await apiFetch<AuthResponse>('/auth/social', {
        method: 'POST',
        body: JSON.stringify({ provider, idToken, email, name })
      });
      await setAuth(response.user.id, response.session);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Sign-in failed');
    }
  };

  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>1) Sign In</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" style={{ backgroundColor: '#1f2937', color: 'white', padding: 10 }} />
      <TextInput value={name} onChangeText={setName} placeholder="Name" style={{ backgroundColor: '#1f2937', color: 'white', padding: 10 }} />
      <TextInput value={idToken} onChangeText={setIdToken} placeholder="Google/Apple ID token" style={{ backgroundColor: '#1f2937', color: 'white', padding: 10 }} />
      <Pressable onPress={() => signIn('google')} style={{ backgroundColor: '#2563eb', padding: 12 }}><Text style={{ color: 'white' }}>Continue with Google</Text></Pressable>
      <Pressable onPress={() => signIn('apple')} style={{ backgroundColor: '#111827', padding: 12, borderWidth: 1, borderColor: '#4b5563' }}><Text style={{ color: 'white' }}>Continue with Apple</Text></Pressable>
      {!!error && <Text style={{ color: '#fca5a5' }}>{error}</Text>}
    </View>
  );
}
