import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../api/client';

const QUEUE_KEY = 'gymbros.offlineQueue.v1';

export type OfflineAction =
  | { type: 'MEAL_LOG'; payload: Record<string, unknown> }
  | { type: 'WORKOUT_SET'; payload: Record<string, unknown> }
  | { type: 'SYNC_PAYLOAD'; payload: Record<string, unknown> };

async function readQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return [] as OfflineAction[];
  }

  try {
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

async function writeQueue(items: OfflineAction[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function enqueueOfflineAction(action: OfflineAction) {
  const queue = await readQueue();
  queue.push(action);
  await writeQueue(queue);
  return queue.length;
}

export async function getOfflineQueueLength() {
  const queue = await readQueue();
  return queue.length;
}

export async function flushOfflineQueue() {
  const queue = await readQueue();
  if (queue.length === 0) {
    return { flushed: 0, remaining: 0 };
  }

  const remaining: OfflineAction[] = [];
  let flushed = 0;

  for (const action of queue) {
    try {
      if (action.type === 'MEAL_LOG') {
        await apiFetch('/meals/logs', { method: 'POST', body: JSON.stringify(action.payload) });
      } else if (action.type === 'WORKOUT_SET') {
        await apiFetch('/workouts/sets', { method: 'POST', body: JSON.stringify(action.payload) });
      } else {
        await apiFetch('/sync', { method: 'POST', body: JSON.stringify(action.payload) });
      }
      flushed += 1;
    } catch {
      remaining.push(action);
    }
  }

  await writeQueue(remaining);
  return { flushed, remaining: remaining.length };
}

export function startOfflineQueueWorker(onResult?: (result: { flushed: number; remaining: number }) => void) {
  const id = setInterval(() => {
    flushOfflineQueue()
      .then((result) => {
        if (result.flushed > 0 || result.remaining > 0) {
          onResult?.(result);
        }
      })
      .catch(() => undefined);
  }, 10000);

  return () => clearInterval(id);
}
