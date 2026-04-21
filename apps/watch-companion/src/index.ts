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
