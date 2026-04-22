import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function OnboardingScreen() {
  const { userId } = useAuth();
  const [result, setResult] = useState('');
  const [age, setAge] = useState('22');
  const [weight, setWeight] = useState('78');
  const [height, setHeight] = useState('176');

  const submit = async () => {
    if (!userId) return;

    const profile = await apiFetch('/onboarding', {
      method: 'POST',
      body: JSON.stringify({ userId, age: Number(age), sex: 'male', weightKg: Number(weight), heightCm: Number(height), activityLevel: 'moderate', goal: 'maintain' })
    });

    const recommendations = await apiFetch<{ meals: Array<{ name: string }> }>(`/nutrition/recommendations/${userId}`);
    setResult(`Targets saved. Meals: ${recommendations.meals.map((meal) => meal.name).join(', ')}`);
  };

  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>2) Onboarding + Nutrition</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput value={age} onChangeText={setAge} keyboardType="numeric" style={{ flex: 1, backgroundColor: '#1f2937', color: 'white', padding: 10 }} placeholder="Age" />
        <TextInput value={weight} onChangeText={setWeight} keyboardType="numeric" style={{ flex: 1, backgroundColor: '#1f2937', color: 'white', padding: 10 }} placeholder="Weight kg" />
        <TextInput value={height} onChangeText={setHeight} keyboardType="numeric" style={{ flex: 1, backgroundColor: '#1f2937', color: 'white', padding: 10 }} placeholder="Height cm" />
      </View>
      <Pressable onPress={submit} style={{ backgroundColor: '#16a34a', padding: 12 }}><Text style={{ color: 'white' }}>Calculate Targets</Text></Pressable>
      {!!result && <Text style={{ color: '#93c5fd' }}>{result}</Text>}
    </View>
  );
}
