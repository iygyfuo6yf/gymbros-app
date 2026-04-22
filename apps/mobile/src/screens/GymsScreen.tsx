import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { apiFetch } from '../api/client';

export function GymsScreen() {
  const [gyms, setGyms] = useState<Array<{ name: string; promoted: boolean; rating: number }>>([]);

  const load = async () => {
    const response = await apiFetch<Array<{ name: string; promoted: boolean; rating: number }>>('/gyms/recommended');
    setGyms(response);
  };

  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>7) Recommended Gyms</Text>
      <Pressable onPress={load} style={{ backgroundColor: '#ef4444', padding: 12 }}><Text style={{ color: 'white' }}>Load Gyms</Text></Pressable>
      {gyms.map((gym) => (
        <Text key={gym.name} style={{ color: 'white' }}>{gym.promoted ? '⭐ ' : ''}{gym.name} ({gym.rating})</Text>
      ))}
    </View>
  );
}
