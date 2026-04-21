import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { MealTrackerScreen } from './src/screens/MealTrackerScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { GymsScreen } from './src/screens/GymsScreen';

export default function App() {
  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: '#030712' }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '700', marginBottom: 16 }}>GymBros MVP</Text>
          <AuthScreen />
          <OnboardingScreen />
          <MealTrackerScreen />
          <WorkoutScreen />
          <CalendarScreen />
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>6) Offline + Sync</Text>
            <Text style={{ color: '#d1d5db' }}>Local queue + /sync latest-edit-with-safe-merge strategy is wired in backend API scaffold.</Text>
          </View>
          <GymsScreen />
        </ScrollView>
      </View>
    </AuthProvider>
  );
}
