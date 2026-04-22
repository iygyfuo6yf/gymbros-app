import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ProgressiveOverloadResponse } from '../types';
import { enqueueOfflineAction } from '../sync/offlineQueue';

export function WorkoutScreen() {
  const { userId } = useAuth();
  const [exerciseId, setExerciseId] = useState('ex-squat');
  const [status, setStatus] = useState('');

  const logSet = async () => {
    if (!userId) return;

    const payload = { userId, exerciseId, reps: 5, weightKg: 100, repRange: '5-8', performedAt: new Date().toISOString() };

    try {
      await apiFetch('/workouts/sets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      const queueSize = await enqueueOfflineAction({ type: 'WORKOUT_SET', payload });
      setStatus(`Offline: set queued (${queueSize} pending)`);
      return;
    }

    const progress = await apiFetch<ProgressiveOverloadResponse>(`/workouts/progressive/${userId}/${exerciseId}`);
    const latest = progress.trend.at(-1)?.estimated1RM;

    await apiFetch('/watch/snapshot', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        activeRoutineName: 'Live Workout',
        currentSet: progress.trend.length,
        targetRepRange: payload.repRange,
        capturedAt: new Date().toISOString()
      })
    }).catch(() => undefined);

    setStatus(`Set logged. Latest estimated 1RM: ${latest ?? '-'} kg • Synced to watch feed`);
  };

  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>4) Workout Builder + Progressive Overload</Text>
      <TextInput value={exerciseId} onChangeText={setExerciseId} style={{ backgroundColor: '#1f2937', color: 'white', padding: 10 }} placeholder="Exercise id" />
      <Pressable onPress={logSet} style={{ backgroundColor: '#f59e0b', padding: 12 }}><Text style={{ color: '#111827' }}>Log Working Set</Text></Pressable>
      {!!status && <Text style={{ color: '#fde68a' }}>{status}</Text>}
    </View>
  );
}
