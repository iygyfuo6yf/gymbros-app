import { store } from '../src/lib/store.js';

export function resetStore() {
  store.users = [];
  store.profiles = [];
  store.mealLogs = [];
  store.routines = [];
  store.setLogs = [];
}
