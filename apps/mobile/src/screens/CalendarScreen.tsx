import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function CalendarScreen() {
  const { userId } = useAuth();
  const [summary, setSummary] = useState('');

  const loadSummary = async () => {
    if (!userId) return;

    const response = await apiFetch<{ streak: number; totalWorkouts: number; totalMealsLogged: number }>(`/calendar/summary/${userId}`);
    setSummary(`Streak: ${response.streak} day(s) • Workouts: ${response.totalWorkouts} • Meals: ${response.totalMealsLogged}`);
  };

  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>5) Calendar + Consistency</Text>
      <Pressable onPress={loadSummary} style={{ backgroundColor: '#06b6d4', padding: 12 }}><Text style={{ color: '#111827' }}>Refresh Summary</Text></Pressable>
      {!!summary && <Text style={{ color: '#a5f3fc' }}>{summary}</Text>}
    </View>
  );
}
