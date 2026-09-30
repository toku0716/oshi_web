import { getDB } from '../db/database';
import type { Goods } from '../types';

export const goodsRepository = {
  async getAll(): Promise<Goods[]> {
    const db = await getDB();
    const list = await db.getAll('goods');
    return list.sort((a, b) => (b.purchaseDate || b.createdAt).localeCompare(a.purchaseDate || a.createdAt));
  },

  async getRecent(limit = 6): Promise<Goods[]> {
    const db = await getDB();
    const list = await db.getAll('goods');
    return list
      .sort((a, b) => (b.purchaseDate || b.createdAt).localeCompare(a.purchaseDate || a.createdAt))
      .slice(0, limit);
  },

  async getByOshiId(oshiId: string): Promise<Goods[]> {
    const db = await getDB();
    return db.getAllFromIndex('goods', 'by-oshiId', oshiId);
  },

  async getById(id: string): Promise<Goods | undefined> {
    const db = await getDB();
    return db.get('goods', id);
  },

  async save(goods: Goods): Promise<void> {
    const db = await getDB();
    const now = new Date().toISOString();
    const existing = await db.get('goods', goods.id);
    const itemToSave: Goods = {
      ...goods,
      createdAt: existing?.createdAt || goods.createdAt || now,
      updatedAt: now,
    };
    await db.put('goods', itemToSave);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('goods', id);
  },
};
