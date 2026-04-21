import { store } from '../lib/store.js';

console.log('Seed preview');
console.table(store.exercises);
console.table(store.meals);
console.table(store.gyms);
