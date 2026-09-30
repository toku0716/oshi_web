import { getDB } from '../db/database';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  activeOshiId: 'all',
  themeColor: '#ec4899', // Default pink
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const settingsRepository = {
  async getSettings(): Promise<AppSettings> {
    const db = await getDB();
    const settings = await db.get('settings', 'default');
    if (!settings) {
      await db.put('settings', DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return settings;
  },

  async saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const db = await getDB();
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...patch,
      id: 'default',
      updatedAt: new Date().toISOString(),
    };
    await db.put('settings', updated);
    return updated;
  },
};
