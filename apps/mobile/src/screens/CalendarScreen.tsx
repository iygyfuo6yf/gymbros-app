import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { enqueueOfflineAction } from '../sync/offlineQueue';

interface TrendPoint {
  date: string;
  volumeKg: number;
  estimated1RM: number;
  adherencePct: number | null;
}

export function CalendarScreen() {
  const { userId } = useAuth();
  const [summary, setSummary] = useState('');
  const [trendSummary, setTrendSummary] = useState('');
  const [conflicts, setConflicts] = useState<Array<{ id: string }>>([]);

  const loadSummary = async () => {
    if (!userId) return;

    const response = await apiFetch<{ streak: number; totalWorkouts: number; totalMealsLogged: number }>(`/calendar/summary/${userId}`);
    setSummary(`Streak: ${response.streak} day(s) • Workouts: ${response.totalWorkouts} • Meals: ${response.totalMealsLogged}`);

    const trend = await apiFetch<{ points: TrendPoint[] }>(`/calendar/trends/${userId}`);
    const last = trend.points.at(-1);
    if (!last) {
      setTrendSummary('No trend data yet.');
      return;
    }

    const bar = '█'.repeat(Math.max(1, Math.min(10, Math.round(last.adherencePct ? last.adherencePct / 10 : 0))));
    setTrendSummary(`Volume ${last.volumeKg}kg • 1RM ${last.estimated1RM}kg • Nutrition ${last.adherencePct ?? 0}% ${bar}`);
  };

  const previewConflicts = async () => {
    if (!userId) return;

    const payload = {
      userId,
      previewOnly: true,
      mealLogs: [],
      workoutSetLogs: []
    };

    try {
      const response = await apiFetch<{ conflicts: { meals: Array<{ id: string }>; workoutSets: Array<{ id: string }> } }>('/sync', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setConflicts([...response.conflicts.meals, ...response.conflicts.workoutSets]);
    } catch {
      await enqueueOfflineAction({ type: 'SYNC_PAYLOAD', payload: { ...payload, previewOnly: false } });
    }
  };

  const applyConflictPreference = async (source: 'client' | 'server') => {
    if (!userId || conflicts.length === 0) return;

    await apiFetch('/sync', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        mealLogs: [],
        workoutSetLogs: [],
        resolutions: conflicts.map((item) => ({ id: item.id, source }))
      })
    });

    setSummary(`Resolved ${conflicts.length} conflict(s) using ${source} version`);
    setConflicts([]);
  };

  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>5) Calendar + Consistency + Trends</Text>
      <Pressable onPress={loadSummary} style={{ backgroundColor: '#06b6d4', padding: 12 }}><Text style={{ color: '#111827' }}>Refresh Summary + Trends</Text></Pressable>
      {!!summary && <Text style={{ color: '#a5f3fc' }}>{summary}</Text>}
      {!!trendSummary && <Text style={{ color: '#bfdbfe' }}>{trendSummary}</Text>}

      <Pressable onPress={previewConflicts} style={{ backgroundColor: '#1d4ed8', padding: 10 }}><Text style={{ color: 'white' }}>Preview Sync Conflicts</Text></Pressable>
      {conflicts.length > 0 ? (
        <View style={{ backgroundColor: '#111827', padding: 10, gap: 6 }}>
          <Text style={{ color: '#fef08a' }}>{conflicts.length} conflict(s) need your choice</Text>
          <Pressable onPress={() => applyConflictPreference('client')} style={{ backgroundColor: '#22c55e', padding: 8 }}><Text style={{ color: '#052e16' }}>Keep my phone changes</Text></Pressable>
          <Pressable onPress={() => applyConflictPreference('server')} style={{ backgroundColor: '#f59e0b', padding: 8 }}><Text style={{ color: '#111827' }}>Keep server changes</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}
