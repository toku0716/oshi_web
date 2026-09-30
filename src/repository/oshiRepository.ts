import { getDB } from '../db/database';
import type { Oshi } from '../types';

export const oshiRepository = {
  async getAll(): Promise<Oshi[]> {
    const db = await getDB();
    const list = await db.getAll('oshis');
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt.localeCompare(b.createdAt));
  },

  async getById(id: string): Promise<Oshi | undefined> {
    const db = await getDB();
    return db.get('oshis', id);
  },

  async save(oshi: Oshi): Promise<void> {
    const db = await getDB();
    const now = new Date().toISOString();
    const existing = await db.get('oshis', oshi.id);
    const itemToSave: Oshi = {
      ...oshi,
      createdAt: existing?.createdAt || oshi.createdAt || now,
      updatedAt: now,
    };
    await db.put('oshis', itemToSave);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('oshis', id);
  },
};
