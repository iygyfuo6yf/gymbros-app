import { describe, expect, it } from 'vitest';
import { mergeLatest } from '../src/services/sync.js';

describe('mergeLatest', () => {
  it('keeps newest version during conflicts', () => {
    const merged = mergeLatest(
      [{ id: '1', updatedAt: '2026-01-01T10:00:00.000Z', value: 1 }],
      [{ id: '1', updatedAt: '2026-01-01T11:00:00.000Z', value: 3 }]
    );

    expect(merged).toHaveLength(1);
    expect((merged[0] as { value: number }).value).toBe(3);
  });
});
