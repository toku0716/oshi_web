import { getDB } from '../db/database';
import type { OshiEvent } from '../types';

export const eventRepository = {
  async getAll(): Promise<OshiEvent[]> {
    const db = await getDB();
    const list = await db.getAll('events');
    return list.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  },

  async getUpcoming(todayStr?: string, limit = 5): Promise<OshiEvent[]> {
    const db = await getDB();
    const today = todayStr || new Date().toISOString().slice(0, 10);
    const all = await db.getAll('events');
    return all
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, limit);
  },

  async getByDate(date: string): Promise<OshiEvent[]> {
    const db = await getDB();
    const events = await db.getAllFromIndex('events', 'by-date', date);
    return events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  },

  async getByMonth(yearMonth: string): Promise<OshiEvent[]> {
    // yearMonth: e.g. "2026-09"
    const db = await getDB();
    const all = await db.getAll('events');
    return all
      .filter((e) => e.date.startsWith(yearMonth))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  },

  async getByOshiId(oshiId: string): Promise<OshiEvent[]> {
    const db = await getDB();
    return db.getAllFromIndex('events', 'by-oshiId', oshiId);
  },

  async getById(id: string): Promise<OshiEvent | undefined> {
    const db = await getDB();
    return db.get('events', id);
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
