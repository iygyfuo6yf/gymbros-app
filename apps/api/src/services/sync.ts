interface SyncableRecord {
  id: string;
  updatedAt: string;
}

export function mergeLatest<T extends SyncableRecord>(serverRecords: T[], incomingRecords: T[]): T[] {
  const byId = new Map<string, T>();

  for (const record of serverRecords) {
    byId.set(record.id, record);
  }

  for (const incoming of incomingRecords) {
    const current = byId.get(incoming.id);

    if (!current) {
      byId.set(incoming.id, incoming);
      continue;
    }

    const incomingTime = new Date(incoming.updatedAt).getTime();
    const currentTime = new Date(current.updatedAt).getTime();

    if (incomingTime >= currentTime) {
      byId.set(incoming.id, { ...current, ...incoming, updatedAt: incoming.updatedAt });
    }
  }

  return Array.from(byId.values());
}
