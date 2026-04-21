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

  it('keeps server version when incoming is older and merges new records', () => {
    const merged = mergeLatest(
      [
        { id: '1', updatedAt: '2026-01-01T11:00:00.000Z', value: 10 },
        { id: '2', updatedAt: '2026-01-01T09:00:00.000Z', value: 20 }
      ],
      [
        { id: '1', updatedAt: '2026-01-01T10:00:00.000Z', value: 5 },
        { id: '3', updatedAt: '2026-01-01T12:00:00.000Z', value: 30 }
      ]
    );

    expect(merged).toHaveLength(3);
    expect((merged.find((record) => record.id === '1') as { value: number }).value).toBe(10);
    expect((merged.find((record) => record.id === '3') as { value: number }).value).toBe(30);
  });
});
