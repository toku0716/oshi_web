import type { GoogleUser, BackupData, GoogleCloudBackupMetadata } from '../types';

const STORAGE_KEY_USER = 'oshiss_google_user';
const STORAGE_KEY_CLIENT_ID = 'oshiss_google_client_id';
const STORAGE_KEY_CLOUD_BACKUP_PREFIX = 'oshiss_google_cloud_backup_';

export const googleAuthRepository = {
  /**
   * Get currently linked Google user from localStorage
   */
  getStoredUser(): GoogleUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      if (!data) return null;
      return JSON.parse(data) as GoogleUser;
    } catch (err) {
      console.error('Failed to parse Google user from localStorage:', err);
      return null;
    }
  },

  /**
   * Save or update linked Google user
   */
  saveUser(user: GoogleUser): void {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save Google user to localStorage:', err);
    }
  },

  /**
   * Unlink Google user
   */
  removeUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (err) {
      console.error('Failed to remove Google user:', err);
    }
  },

  /**
   * Get Google OAuth Client ID (from localStorage or Vite env)
   */
  getClientId(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
      if (stored && stored.trim()) return stored.trim();
    } catch {
      // Ignore storage error
    }
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    return (envClientId && typeof envClientId === 'string') ? envClientId.trim() : '';
  },

  /**
   * Save custom Google OAuth Client ID
   */
  saveClientId(clientId: string): void {
    try {
      if (clientId.trim()) {
        localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
      }
    } catch (err) {
      console.error('Failed to save Google Client ID:', err);
    }
  },

  /**
   * Safely decode Google Identity Services credential JWT
   */
  parseJwt(token: string): { sub: string; name: string; email: string; picture?: string } | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return {
        sub: parsed.sub || '',
        name: parsed.name || parsed.given_name || 'Googleユーザー',
        email: parsed.email || '',
        picture: parsed.picture || undefined,
      };
    } catch (err) {
      console.error('Failed to decode Google JWT token:', err);
      return null;
    }
  },

  /**
   * Save backup snapshot to Google Cloud storage cache
   */
  saveCloudBackup(userId: string, backup: BackupData): GoogleCloudBackupMetadata {
    const raw = JSON.stringify(backup);
    const key = `${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`;
    localStorage.setItem(key, raw);

    const oshisCount = backup.data.oshis.length;
    const eventsCount = backup.data.events.length;
    const todosCount = backup.data.todos.length;
    const goodsCount = backup.data.goods.length;
    const sizeBytes = new Blob([raw]).size;

    return {
      updatedAt: backup.createdAt,
      oshisCount,
      eventsCount,
      todosCount,
      goodsCount,
      sizeBytes,
    };
  },

  /**
   * Retrieve cloud backup data for the user
   */
  getCloudBackup(userId: string): BackupData | null {
    try {
      const key = `${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as BackupData;
    } catch (err) {
      console.error('Failed to parse cloud backup data:', err);
      return null;
    }
  },

  /**
   * Get metadata for existing cloud backup
   */
  getCloudBackupMetadata(userId: string): GoogleCloudBackupMetadata | null {
    try {
      const backup = this.getCloudBackup(userId);
      if (!backup || !backup.data) return null;
      const key = `${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`;
      const raw = localStorage.getItem(key) || '';
      return {
        updatedAt: backup.createdAt,
        oshisCount: backup.data.oshis?.length || 0,
        eventsCount: backup.data.events?.length || 0,
        todosCount: backup.data.todos?.length || 0,
        goodsCount: backup.data.goods?.length || 0,
        sizeBytes: new Blob([raw]).size,
      };
    } catch (err) {
      console.error('Failed to get cloud backup metadata:', err);
      return null;
    }
  },

  /**
   * Clear cloud backup data for the user
   */
  clearCloudBackup(userId: string): void {
    try {
      const key = `${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`;
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Failed to remove cloud backup:', err);
    }
  },

  /**
   * Preset accounts for 1-click test linking
   */
  getPresetDemoAccounts(): Array<{
    name: string;
    email: string;
    picture: string;
    description: string;
  }> {
    return [
      {
        name: '推し活アカウント (メイン)',
        email: 'oshikatsu.fan@gmail.com',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        description: 'Googleフォト・予定連動用メインアカウント',
      },
      {
        name: 'ライブ・遠征専用アカウント',
        email: 'live.ticket.fan@gmail.com',
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        description: 'チケット申込・スケジュール専用アカウント',
      },
    ];
  },
};
