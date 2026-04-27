export interface WatchWorkoutSnapshot {
  activeRoutineName: string;
  currentSet: number;
  targetRepRange: string;
}

export function buildWatchSnapshot(activeRoutineName: string, currentSet: number, targetRepRange: string): WatchWorkoutSnapshot {
  return {
    activeRoutineName,
    currentSet,
    targetRepRange
  };
}

export async function fetchLatestWatchSnapshot(apiUrl: string, userId: string): Promise<WatchWorkoutSnapshot | null> {
  const response = await fetch(`${apiUrl}/watch/snapshot/${userId}`);
  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as (WatchWorkoutSnapshot & { capturedAt?: string }) | null;
  if (!payload) {
    return null;
  }

  return {
    activeRoutineName: payload.activeRoutineName,
    currentSet: payload.currentSet,
    targetRepRange: payload.targetRepRange
  };
}
