import { getDB } from '../db/database';
import type { JournalEntry } from '../types';

export const journalRepository = {
  async getAll(): Promise<JournalEntry[]> {
    const db = await getDB();
    const list = await db.getAll('journals');
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  async getById(id: string): Promise<JournalEntry | undefined> {
    const db = await getDB();
    return db.get('journals', id);
  },

  async save(entry: JournalEntry): Promise<JournalEntry> {
    const db = await getDB();
    const toSave: JournalEntry = {
      ...entry,
      updatedAt: new Date().toISOString(),
      createdAt: entry.createdAt || new Date().toISOString(),
    };
    await db.put('journals', toSave);
    return toSave;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('journals', id);
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('journals');
  },
};
