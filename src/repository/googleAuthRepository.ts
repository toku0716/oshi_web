import type { GoogleUser, BackupData, GoogleCloudBackupMetadata } from '../types';

const STORAGE_KEY_USER = 'oshiss_google_user';
const STORAGE_KEY_CLOUD_BACKUP_PREFIX = 'oshiss_google_cloud_backup_';
const STORAGE_KEY_DRIVE_INFO_PREFIX = 'oshiss_google_drive_file_info_';
const STORAGE_KEY_ACCESS_TOKEN = 'oshiss_google_drive_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'oshiss_google_drive_token_expiry';

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
      sessionStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
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
   * Render official Google Identity Services (GIS) button in a container element.
   * This is Google's official, verified sign-in button that avoids "unverified app / dangerous site" warnings.
   */
  initAndRenderButton(
    container: HTMLElement,
    onSuccess: (user: GoogleUser) => void,
    onError?: (err: any) => void
  ): () => void {
    const clientId = this.getClientId();
    if (!clientId) {
      if (onError) onError(new Error('Google OAuth クライアントIDが設定されていません'));
      return () => {};
    }

    const tryRender = () => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => {
            if (response && response.credential) {
              const profile = this.parseJwt(response.credential);
              if (profile) {
                const user: GoogleUser = {
                  id: profile.sub || `google-${Date.now()}`,
                  name: profile.name,
                  email: profile.email,
                  picture: profile.picture,
                  linkedAt: new Date().toISOString(),
                  autoSync: true,
                };
                this.saveUser(user);
                onSuccess(user);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        container.innerHTML = '';
        const isDark = document.documentElement.classList.contains('dark');
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 280,
        });
        return true;
      } catch (err) {
        console.error('Failed to render official Google Sign-In button:', err);
        if (onError) onError(err);
        return false;
      }
    };

    if (tryRender()) {
      return () => {};
    }

    // If Google GSI script is still loading, wait for it
    const timer = setInterval(() => {
      if (tryRender()) {
        clearInterval(timer);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(timer);
    }, 6000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  },

  /**
   * Popup sign-in via Google OAuth Token Client (does not navigate away from the site)
   */
  signInWithPopup(
    onSuccess: (user: GoogleUser) => void,
    onError?: (err: any) => void
  ): void {
    const clientId = this.getClientId();
    if (!clientId) {
      if (onError) onError(new Error('Google OAuth クライアントIDが設定されていません'));
      return;
    }

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid profile email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error('Google OAuth token error:', tokenResponse);
              if (onError) onError(new Error(tokenResponse.error));
              return;
            }
            try {
              if (tokenResponse.access_token) {
                try {
                  sessionStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, tokenResponse.access_token);
                  sessionStorage.setItem(
                    STORAGE_KEY_TOKEN_EXPIRY,
                    (Date.now() + (Number(tokenResponse.expires_in) || 3600) * 1000).toString()
                  );
                } catch {}
              }

              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              if (!res.ok) throw new Error('userinfo failed');
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
              onSuccess(user);
            } catch (err) {
              if (onError) onError(err);
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('OAuth popup fallback to redirect:', err);
      }
    }

    this.redirectToGoogleAuth();
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

      try {
        sessionStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);
        sessionStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, (Date.now() + 3600000).toString());
      } catch {}

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
   * Request Google OAuth 2.0 access token with Google Drive scope using Google Identity Services Token Client
   */
  async requestDriveAccessToken(forcePrompt: boolean = false): Promise<string> {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('Google OAuth クライアントIDが設定されていません');
    }

    // Check cached token in sessionStorage
    try {
      const cachedToken = sessionStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
      const cachedExpiry = sessionStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
      if (cachedToken && cachedExpiry && !forcePrompt) {
        const expiryTime = Number(cachedExpiry);
        if (Date.now() < expiryTime - 60000) {
          return cachedToken;
        }
      }
    } catch {}

    const oauth2 = typeof window !== 'undefined' ? window.google?.accounts?.oauth2 : undefined;
    if (!oauth2) {
      throw new Error('Google Identity Services SDKが読み込まれていません。ページを再読み込みしてください。');
    }

    return new Promise((resolve, reject) => {
      try {
        const client = oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
          callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error('Google OAuth token error:', tokenResponse);
              reject(new Error(tokenResponse.error_description || tokenResponse.error));
              return;
            }
            if (tokenResponse.access_token) {
              const token = tokenResponse.access_token;
              const expiresIn = Number(tokenResponse.expires_in) || 3600;
              const expiry = Date.now() + expiresIn * 1000;
              try {
                sessionStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, token);
                sessionStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiry.toString());
              } catch {}
              resolve(token);
            } else {
              reject(new Error('アクセストークンを取得できませんでした'));
            }
          },
        });

        client.requestAccessToken({ prompt: forcePrompt ? 'consent' : '' });
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Get cached Google Drive file information from localStorage
   */
  getStoredDriveInfo(
    userId?: string
  ): { fileId: string; name?: string; modifiedTime?: string; size?: number; webViewLink?: string } | null {
    if (!userId) return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_DRIVE_INFO_PREFIX}${userId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Upload backup data directly to user's Google Drive as 'oshisapo_backup.json'
   */
  async uploadToGoogleDrive(
    userId: string,
    backup: BackupData
  ): Promise<{ fileId: string; modifiedTime: string; size: number; webViewLink?: string }> {
    let token = await this.requestDriveAccessToken(false);

    const executeFetch = async (url: string, init: RequestInit) => {
      let res = await fetch(url, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        // Token expired, re-prompt
        token = await this.requestDriveAccessToken(true);
        res = await fetch(url, {
          ...init,
          headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return res;
    };

    // 1. Search for existing oshisapo_backup.json
    const query = encodeURIComponent("name = 'oshisapo_backup.json' and trashed = false");
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size,webViewLink)&spaces=drive`;
    const searchRes = await executeFetch(searchUrl, { method: 'GET' });

    if (!searchRes.ok) {
      const errBody = await searchRes.json().catch(() => null);
      const errMsg = errBody?.error?.message || searchRes.statusText;
      if (
        searchRes.status === 403 &&
        (errMsg.includes('has not been used in project') ||
          errMsg.includes('disabled') ||
          errMsg.includes('Access Not Configured'))
      ) {
        const err = new Error('GOOGLE_DRIVE_API_NOT_ENABLED');
        (err as any).details = errMsg;
        throw err;
      }
      throw new Error(`Google Driveの接続に失敗しました (${searchRes.status}): ${errMsg}`);
    }

    const searchData = await searchRes.json();
    const existingFile =
      searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

    const jsonString = JSON.stringify(backup, null, 2);
    let fileId: string;
    let modifiedTime: string;
    let size: number;
    let webViewLink: string | undefined;

    if (existingFile && existingFile.id) {
      // Update existing file via PATCH media
      const patchUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
      const updateRes = await executeFetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonString,
      });

      if (!updateRes.ok) {
        const errBody = await updateRes.json().catch(() => null);
        throw new Error(`Google Driveの更新に失敗しました: ${errBody?.error?.message || updateRes.statusText}`);
      }

      const updatedData = await updateRes.json();
      fileId = updatedData.id || existingFile.id;
      modifiedTime = updatedData.modifiedTime || new Date().toISOString();
      size = updatedData.size ? Number(updatedData.size) : new Blob([jsonString]).size;
      webViewLink = updatedData.webViewLink || existingFile.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    } else {
      // Create new file via multipart upload
      const boundary = '-------oshisapo' + Math.random().toString(36).substring(2);
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: 'oshisapo_backup.json',
        mimeType: 'application/json',
        description: '推しサポ (Oshisapo) クラウド自動バックアップデータ',
      };

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        jsonString +
        closeDelimiter;

      const uploadUrl =
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size,webViewLink';
      const createRes = await executeFetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => null);
        throw new Error(`Google Driveへの新規保存に失敗しました: ${errBody?.error?.message || createRes.statusText}`);
      }

      const createdData = await createRes.json();
      fileId = createdData.id;
      modifiedTime = createdData.modifiedTime || new Date().toISOString();
      size = createdData.size ? Number(createdData.size) : new Blob([jsonString]).size;
      webViewLink = createdData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    }

    const driveInfo = {
      fileId,
      name: 'oshisapo_backup.json',
      modifiedTime,
      size,
      webViewLink,
    };

    try {
      localStorage.setItem(`${STORAGE_KEY_DRIVE_INFO_PREFIX}${userId}`, JSON.stringify(driveInfo));
    } catch {}

    // Update local snapshot cache
    this.saveCloudBackup(userId, backup, driveInfo);

    return driveInfo;
  },

  /**
   * Download and parse backup data directly from Google Drive
   */
  async downloadFromGoogleDrive(userId?: string): Promise<BackupData> {
    let token = await this.requestDriveAccessToken(false);

    const executeFetch = async (url: string, init: RequestInit = {}) => {
      let res = await fetch(url, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        token = await this.requestDriveAccessToken(true);
        res = await fetch(url, {
          ...init,
          headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return res;
    };

    // 1. Search for oshisapo_backup.json
    const query = encodeURIComponent("name = 'oshisapo_backup.json' and trashed = false");
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size,webViewLink)&spaces=drive`;
    const searchRes = await executeFetch(searchUrl);

    if (!searchRes.ok) {
      const errBody = await searchRes.json().catch(() => null);
      const errMsg = errBody?.error?.message || searchRes.statusText;
      if (
        searchRes.status === 403 &&
        (errMsg.includes('has not been used in project') ||
          errMsg.includes('disabled') ||
          errMsg.includes('Access Not Configured'))
      ) {
        const err = new Error('GOOGLE_DRIVE_API_NOT_ENABLED');
        (err as any).details = errMsg;
        throw err;
      }
      throw new Error(`Google Driveの接続に失敗しました: ${errMsg}`);
    }

    const searchData = await searchRes.json();
    if (!searchData.files || searchData.files.length === 0) {
      throw new Error('Googleドライブ内にバックアップファイル「oshisapo_backup.json」が見つかりませんでした。先にバックアップを保存してください。');
    }

    const file = searchData.files[0];
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    const downloadRes = await executeFetch(downloadUrl);

    if (!downloadRes.ok) {
      throw new Error(`Google Driveからのダウンロードに失敗しました (${downloadRes.status})`);
    }

    const backupData = (await downloadRes.json()) as BackupData;
    if (!backupData || !backupData.data) {
      throw new Error('ダウンロードしたバックアップファイルの形式が正しくありません');
    }

    // Cache locally
    if (userId) {
      const driveInfo = {
        fileId: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime || new Date().toISOString(),
        size: file.size ? Number(file.size) : 0,
        webViewLink: file.webViewLink,
      };
      try {
        localStorage.setItem(`${STORAGE_KEY_DRIVE_INFO_PREFIX}${userId}`, JSON.stringify(driveInfo));
      } catch {}
      this.saveCloudBackup(userId, backupData, driveInfo);
    }

    return backupData;
  },

  /**
   * Save backup snapshot to storage cache
   */
  saveCloudBackup(
    userId: string,
    backup: BackupData,
    driveInfo?: { fileId: string; name?: string; modifiedTime?: string; size?: number; webViewLink?: string }
  ): GoogleCloudBackupMetadata {
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

    const effectiveDrive = driveInfo || this.getStoredDriveInfo(userId);

    return {
      updatedAt: effectiveDrive?.modifiedTime || backup.createdAt,
      oshisCount,
      eventsCount,
      todosCount,
      goodsCount,
      sizeBytes,
      driveFileId: effectiveDrive?.fileId,
      driveFileName: effectiveDrive?.name || (effectiveDrive?.fileId ? 'oshisapo_backup.json' : undefined),
      driveFileLink:
        effectiveDrive?.webViewLink ||
        (effectiveDrive?.fileId ? `https://drive.google.com/file/d/${effectiveDrive.fileId}/view` : undefined),
      isDriveSynced: !!effectiveDrive?.fileId,
    };
  },

  /**
   * Retrieve cloud backup data for the user (with automatic safety recovery fallback)
   */
  getCloudBackup(userId?: string): BackupData | null {
    try {
      if (userId) {
        const key = `${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as BackupData;
            if (
              parsed &&
              parsed.data &&
              ((parsed.data.oshis?.length || 0) > 0 ||
                (parsed.data.events?.length || 0) > 0 ||
                (parsed.data.goods?.length || 0) > 0)
            ) {
              return parsed;
            }
          } catch {}
        }
      }

      // Fallback: 全ての保存控え・履歴・自動スナップショットから最新の有効バックアップを救出
      const fallback = this.findRecoverableBackup(userId);
      if (fallback) {
        if (userId) {
          // 現在のGoogleユーザーIDに紐付けて自動保存
          const key = `${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`;
          localStorage.setItem(key, JSON.stringify(fallback));
        }
        return fallback;
      }

      return null;
    } catch (err) {
      console.error('Failed to retrieve cloud backup data:', err);
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
        if (k && (k.startsWith('oshiss_') || k.includes('backup') || k.includes('google'))) {
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
  getCloudBackupMetadata(userId?: string): GoogleCloudBackupMetadata | null {
    try {
      const backup = this.getCloudBackup(userId);
      if (!backup || !backup.data) return null;
      const raw = JSON.stringify(backup);
      const driveInfo = this.getStoredDriveInfo(userId);

      return {
        updatedAt: driveInfo?.modifiedTime || backup.createdAt || new Date().toISOString(),
        oshisCount: backup.data.oshis?.length || 0,
        eventsCount: backup.data.events?.length || 0,
        todosCount: backup.data.todos?.length || 0,
        goodsCount: backup.data.goods?.length || 0,
        sizeBytes: new Blob([raw]).size,
        driveFileId: driveInfo?.fileId,
        driveFileName: driveInfo?.name || (driveInfo?.fileId ? 'oshisapo_backup.json' : undefined),
        driveFileLink:
          driveInfo?.webViewLink ||
          (driveInfo?.fileId ? `https://drive.google.com/file/d/${driveInfo.fileId}/view` : undefined),
        isDriveSynced: !!driveInfo?.fileId,
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
      localStorage.removeItem(`${STORAGE_KEY_CLOUD_BACKUP_PREFIX}${userId}`);
      localStorage.removeItem(`${STORAGE_KEY_DRIVE_INFO_PREFIX}${userId}`);
    } catch (err) {
      console.error('Failed to remove cloud backup:', err);
    }
  },
};
