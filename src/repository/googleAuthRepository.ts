import type { GoogleUser, BackupData, GoogleCloudBackupMetadata } from '../types';

const STORAGE_KEY_USER = 'oshiss_google_user';
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
   * Get Google OAuth Client ID (managed by app via VITE_GOOGLE_CLIENT_ID)
   */
  getClientId(): string {
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (envClientId && typeof envClientId === 'string' && envClientId.trim()) {
      return envClientId.trim();
    }
    return '112431414494-8vj2boelps95u2lu0fo6h39i0gqob2t4.apps.googleusercontent.com';
  },

  /**
   * Redirect browser to Google's genuine OAuth 2.0 authorization endpoint (accounts.google.com)
   */
  redirectToGoogleAuth(): void {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('Google OAuth クライアントIDが設定されていません');
    }
    let redirectUri = window.location.origin + window.location.pathname;
    if (!redirectUri.endsWith('/')) {
      redirectUri += '/';
    }
    const scope = encodeURIComponent('openid profile email');
    const state = Math.random().toString(36).substring(2);
    sessionStorage.setItem('oshiss_oauth_state', state);

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${scope}&state=${state}&prompt=select_account`;

    window.location.href = url;
  },

  /**
   * Check URL hash on page load and extract Google access token if returning from Google OAuth redirect
   */
  async handleOAuthRedirectCallback(): Promise<GoogleUser | null> {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) return null;

    try {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      if (!accessToken) return null;

      // Clean the URL hash so tokens aren't left visible in the address bar
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      // Verify token and fetch genuine user profile directly from Google
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        console.error('Failed to fetch userinfo from Google:', res.status, res.statusText);
        return null;
      }

      const data = await res.json();
      const user: GoogleUser = {
        id: data.sub || `google-${Date.now()}`,
        name: data.name || data.given_name || 'Googleユーザー',
        email: data.email,
        picture: data.picture,
        linkedAt: new Date().toISOString(),
        autoSync: true,
      };

      this.saveUser(user);
      return user;
    } catch (err) {
      console.error('OAuth redirect parsing error:', err);
      return null;
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
    const key = `${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`;
    const historyKey = `${STORAGE_KEY_CLOUD_BACKUP_PREFIX}history_${userId}`;

    const existingRaw = localStorage.getItem(key);
    let existingBackup: BackupData | null = null;
    if (existingRaw) {
      try {
        existingBackup = JSON.parse(existingRaw);
      } catch {}
    }

    const incomingCount =
      (backup.data.oshis?.length || 0) +
      (backup.data.events?.length || 0) +
      (backup.data.goods?.length || 0) +
      (backup.data.todos?.length || 0);

    const existingCount = existingBackup
      ? (existingBackup.data.oshis?.length || 0) +
        (existingBackup.data.events?.length || 0) +
        (existingBackup.data.goods?.length || 0) +
        (existingBackup.data.todos?.length || 0)
      : 0;

    // Safety: 既存データがあり、新バックアップが0件の場合は空上書きを阻止して既存データを保護
    if (incomingCount === 0 && existingCount > 0 && existingBackup) {
      console.warn('Prevented overwriting non-empty backup with empty backup');
      return this.getCloudBackupMetadata(userId)!;
    }

    // 既存データを履歴として保存（直近5世代）
    if (existingRaw && existingCount > 0 && existingBackup) {
      try {
        const historyRaw = localStorage.getItem(historyKey);
        const history: BackupData[] = historyRaw ? JSON.parse(historyRaw) : [];
        history.unshift(existingBackup);
        localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 5)));
      } catch {}
    }

    const raw = JSON.stringify(backup);
    localStorage.setItem(key, raw);

    // 緊急セーフティスナップショット（端末内ローカル自動保存）
    if (incomingCount > 0) {
      try {
        localStorage.setItem('oshiss_auto_safety_snapshot', raw);
      } catch {}
    }

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
   * Scan localStorage for any previous non-empty backup data to allow user recovery
   */
  findRecoverableBackup(userId?: string): BackupData | null {
    const candidates: BackupData[] = [];

    const checkAndAdd = (rawStr: string | null) => {
      if (!rawStr) return;
      try {
        const parsed = JSON.parse(rawStr);
        if (parsed && typeof parsed === 'object') {
          if (parsed.data && Array.isArray(parsed.data.oshis) && parsed.data.oshis.length > 0) {
            candidates.push(parsed);
          } else if (Array.isArray(parsed.oshis) && parsed.oshis.length > 0) {
            candidates.push({
              app: 'oshiss',
              backupVersion: 1,
              createdAt: parsed.createdAt || new Date().toISOString(),
              data: {
                oshis: parsed.oshis || [],
                events: parsed.events || [],
                todos: parsed.todos || [],
                goods: parsed.goods || [],
              },
            });
          }
        }
      } catch {}
    };

    if (userId) {
      checkAndAdd(localStorage.getItem(`${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`));
      try {
        const historyRaw = localStorage.getItem(`${STORAGE_KEY_CLOUD_BACKUP_PREFIX}history_${userId}`);
        if (historyRaw) {
          const list: BackupData[] = JSON.parse(historyRaw);
          list.forEach((b) => candidates.push(b));
        }
      } catch {}
    }

    checkAndAdd(localStorage.getItem('oshiss_auto_safety_snapshot'));

    // 全てのlocalStorageキーを探索して過去のデータを救出
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('oshiss_') || k.includes('backup'))) {
          checkAndAdd(localStorage.getItem(k));
        }
      }
    } catch {}

    if (candidates.length === 0) return null;

    // 最もデータ数が多い（推し、予定、グッズの合計が多い）バックアップを優先
    candidates.sort((a, b) => {
      const aCount =
        (a.data.oshis?.length || 0) * 10 +
        (a.data.events?.length || 0) +
        (a.data.goods?.length || 0);
      const bCount =
        (b.data.oshis?.length || 0) * 10 +
        (b.data.events?.length || 0) +
        (b.data.goods?.length || 0);
      return bCount - aCount;
    });

    return candidates[0] || null;
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
};
