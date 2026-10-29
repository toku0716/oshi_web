import { getDB } from '../db/database';
import type { OshiEvent } from '../types';

export const eventRepository = {
  async getAll(): Promise<OshiEvent[]> {
    const db = await getDB();
    const list = await db.getAll('events');
    return list.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  },

  async save(event: OshiEvent): Promise<void> {
    const db = await getDB();
    const now = new Date().toISOString();
    const existing = await db.get('events', event.id);
    const itemToSave: OshiEvent = {
      ...event,
      createdAt: existing?.createdAt || event.createdAt || now,
      updatedAt: now,
    };
    await db.put('events', itemToSave);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('events', id);
  },
};
