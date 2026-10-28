import type { AppSettings, GoogleAuthSession } from '../types';

const AUTH_SESSION_STORAGE_KEY = 'oshiss_google_auth_session';
const ACCESS_CONFIG_CACHE_KEY = 'oshiss_access_control_cache';

export const ADMIN_AUTH_SESSION_STORAGE_KEY = 'oshiss_admin_google_auth_session';
export const ADMIN_ACCESS_CONFIG_CACHE_KEY = 'oshiss_admin_access_control_cache';

const LEGACY_CLIENT_ID = '112431414494-8vj2boelps95u2lu0fo6h39i0gqob2t4.apps.googleusercontent.com';

export interface EffectiveAdminAccessConfig {
  enabled: boolean;
  googleClientId: string;
  allowedEmails: string[];
  envEmails: string[];
  customEmails: string[];
}

export interface EffectiveAccessConfig {
  enabled: boolean;
  googleClientId: string;
  allowedEmails: string[]; // lowercased, trimmed, deduplicated
  envEmails: string[]; // emails coming from VITE_ALLOWED_GOOGLE_EMAILS (read-only in UI)
  customEmails: string[]; // emails managed in UI settings
}

/**
 * メールアドレスを正規化（小文字・全角半角変換・前後全角半角空白除去）
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email
    .trim()
    .replace(/\u3000/g, ' ')
    .trim()
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .toLowerCase();
}

/**
 * 環境変数とAppSettings（＋localStorageキャッシュ）から有効なアクセス制限設定を取得する
 */
export function getEffectiveAccessConfig(
  settings?: AppSettings | null
): EffectiveAccessConfig {
  const envClientId = (
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || ''
  ).trim();
  const envAllowedRaw = (
    (import.meta.env.VITE_ALLOWED_GOOGLE_EMAILS as string | undefined) || ''
  ).trim();
  const envEnabledRaw = (
    (import.meta.env.VITE_ACCESS_CONTROL_ENABLED as string | undefined) || ''
  )
    .trim()
    .toLowerCase();

  const envEmails = envAllowedRaw
    ? envAllowedRaw
        .split(/[,;\s]+/)
        .map(normalizeEmail)
        .filter((e) => e.includes('@') || e.includes('.'))
    : [];

  let cached: {
    accessControlEnabled?: boolean;
    googleClientId?: string;
    allowedGoogleEmails?: string[];
  } = {};
  try {
    const raw = localStorage.getItem(ACCESS_CONFIG_CACHE_KEY);
    if (raw) {
      cached = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  const customEmailsRaw =
    settings?.allowedGoogleEmails ?? cached.allowedGoogleEmails ?? [];
  const customEmails = customEmailsRaw
    .map(normalizeEmail)
    .filter((e) => e.includes('@') || e.includes('.'));

  const allowedEmails = Array.from(new Set([...envEmails, ...customEmails]));

  const rawClientId = (settings?.googleClientId ?? cached.googleClientId ?? '').trim();
  const validCustomId = rawClientId && rawClientId !== LEGACY_CLIENT_ID ? rawClientId : '';
  const googleClientId = envClientId || validCustomId;

  const explicitSetting =
    settings?.accessControlEnabled ?? cached.accessControlEnabled;

  // 環境変数で明示的に有効化されている場合、または許可メールが環境変数に設定されている場合はデフォルトON
  const defaultEnabled =
    envEnabledRaw === 'true' ||
    envEnabledRaw === '1' ||
    envEmails.length > 0;

  const enabled =
    envEnabledRaw === 'true' || envEnabledRaw === '1'
      ? true
      : explicitSetting !== undefined
        ? explicitSetting
        : defaultEnabled;

  return {
    enabled,
    googleClientId,
    allowedEmails,
    envEmails,
    customEmails,
  };
}

/**
 * アクセス制限設定をlocalStorageにもキャッシュ保存する（起動直後のチラつき防止用）
 */
export function cacheAccessConfig(config: {
  accessControlEnabled?: boolean;
  googleClientId?: string;
  allowedGoogleEmails?: string[];
}): void {
  try {
    const prevRaw = localStorage.getItem(ACCESS_CONFIG_CACHE_KEY);
    const prev = prevRaw ? JSON.parse(prevRaw) : {};
    localStorage.setItem(
      ACCESS_CONFIG_CACHE_KEY,
      JSON.stringify({ ...prev, ...config })
    );
  } catch {
    // ignore
  }
}

/**
 * 管理者（Admin）コンソール用のアクセス制限設定を取得する
 * 推しサポ一般ユーザー用（allowedGoogleEmails）とは完全に分離して管理されます
 */
export function getEffectiveAdminAccessConfig(
  settings?: AppSettings | null
): EffectiveAdminAccessConfig {
  const envClientId = (
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || ''
  ).trim();
  const envAllowedRaw = (
    (import.meta.env.VITE_ADMIN_ALLOWED_GOOGLE_EMAILS as string | undefined) || ''
  ).trim();
  const envEnabledRaw = (
    (import.meta.env.VITE_ADMIN_ACCESS_CONTROL_ENABLED as string | undefined) || ''
  )
    .trim()
    .toLowerCase();

  const envEmails = envAllowedRaw
    ? envAllowedRaw
        .split(/[,;\s]+/)
        .map(normalizeEmail)
        .filter((e) => e.includes('@') || e.includes('.'))
    : [];

  let cached: {
    adminAccessControlEnabled?: boolean;
    googleClientId?: string;
    allowedAdminGoogleEmails?: string[];
  } = {};
  try {
    const raw = localStorage.getItem(ADMIN_ACCESS_CONFIG_CACHE_KEY);
    if (raw) {
      cached = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  const customEmailsRaw =
    settings?.allowedAdminGoogleEmails ?? cached.allowedAdminGoogleEmails ?? [];
  const customEmails = customEmailsRaw
    .map(normalizeEmail)
    .filter((e) => e.includes('@') || e.includes('.'));

  const allowedEmails = Array.from(new Set([...envEmails, ...customEmails]));

  const rawClientId = (settings?.googleClientId ?? cached.googleClientId ?? '').trim();
  const validCustomId = rawClientId && rawClientId !== LEGACY_CLIENT_ID ? rawClientId : '';
  const googleClientId = envClientId || validCustomId;

  const explicitSetting =
    settings?.adminAccessControlEnabled ?? cached.adminAccessControlEnabled;

  // 管理者アクセス制限はデフォルトON（設定がある場合、または環境変数・カスタム登録がある場合）
  const defaultEnabled =
    envEnabledRaw === 'true' ||
    envEnabledRaw === '1' ||
    explicitSetting === true ||
    explicitSetting === undefined;

  const enabled =
    explicitSetting !== undefined ? explicitSetting : defaultEnabled;

  return {
    enabled,
    googleClientId,
    allowedEmails,
    envEmails,
    customEmails,
  };
}

/**
 * 管理者アクセス制限設定をlocalStorageにキャッシュ保存する
 */
export function cacheAdminAccessConfig(config: {
  adminAccessControlEnabled?: boolean;
  googleClientId?: string;
  allowedAdminGoogleEmails?: string[];
}): void {
  try {
    const prevRaw = localStorage.getItem(ADMIN_ACCESS_CONFIG_CACHE_KEY);
    const prev = prevRaw ? JSON.parse(prevRaw) : {};
    localStorage.setItem(
      ADMIN_ACCESS_CONFIG_CACHE_KEY,
      JSON.stringify({ ...prev, ...config })
    );
  } catch {
    // ignore
  }
}

/**
 * 指定されたメールアドレスが許可リストに含まれているか判定する
 * - 完全一致 (例: user@example.ac.jp, user@gmail.com)
 * - ドメイン・末尾一致 (例: @example.ac.jp, .ac.jp, *.ac.jp)
 */
export function isGoogleEmailAllowed(
  email: string,
  allowedEmails: string[]
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) return false;

  const emailDomain = normalized.split('@')[1] || '';

  return allowedEmails.some((ruleRaw) => {
    const rule = normalizeEmail(ruleRaw);
    if (!rule) return false;
    // "@xxx.ac.jp" のようなドメイン指定
    if (rule.startsWith('@')) {
      return (
        normalized.endsWith(rule) ||
        emailDomain === rule.slice(1) ||
        emailDomain.endsWith(`.${rule.slice(1)}`)
      );
    }
    // "*.ac.jp" のようなワイルドカード指定
    if (rule.startsWith('*.')) {
      const suffix = rule.slice(1); // ".ac.jp"
      return (
        normalized.endsWith(suffix) ||
        normalized.endsWith(`@${rule.slice(2)}`) ||
        emailDomain.endsWith(suffix)
      );
    }
    // ".ac.jp" のような末尾指定
    if (rule.startsWith('.')) {
      return normalized.endsWith(rule) || emailDomain.endsWith(rule);
    }
    // "example.ac.jp" のようなアットマーク無しのドメイン指定
    if (!rule.includes('@')) {
      return (
        emailDomain === rule ||
        emailDomain.endsWith(`.${rule}`) ||
        normalized.endsWith(`@${rule}`)
      );
    }
    // 通常のメールアドレス完全一致 (user@xxxx.ac.jp など)
    return normalized === rule;
  });
}

/**
 * Google Identity Services から返却された JWT (credential) をデコード・検証する
 */
export function decodeGoogleJwtCredential(credential: string): {
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  exp?: number;
  aud?: string;
  iss?: string;
} {
  const parts = credential.split('.');
  if (parts.length !== 3) {
    throw new Error('不正なGoogle認証トークン形式です。');
  }

  // Base64Url decode
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '='
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const jsonStr = new TextDecoder().decode(bytes);
  const payload = JSON.parse(jsonStr);

  if (
    payload.iss !== 'accounts.google.com' &&
    payload.iss !== 'https://accounts.google.com'
  ) {
    throw new Error('Google発行のトークンではありません。');
  }

  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('Google認証トークンの有効期限が切れています。');
  }

  if (!payload.email || !payload.email_verified) {
    throw new Error('確認済みのGoogleメールアドレスが取得できませんでした。');
  }

  return {
    email: normalizeEmail(payload.email),
    email_verified: Boolean(payload.email_verified),
    name: payload.name,
    picture: payload.picture,
    exp: payload.exp,
    aud: payload.aud,
    iss: payload.iss,
  };
}

/**
 * 保存済みのGoogleログインセッションを取得する
 */
export function getSavedGoogleSession(): GoogleAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: GoogleAuthSession = JSON.parse(raw);
    if (!session || !session.email) return null;

    // セッション有効期限チェック（設定されている場合）
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }

    return {
      ...session,
      email: normalizeEmail(session.email),
    };
  } catch {
    return null;
  }
}

/**
 * Googleログインセッションを保存する（デフォルト30日間保持）
 */
export function saveGoogleSession(session: GoogleAuthSession): void {
  try {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const toSave: GoogleAuthSession = {
      ...session,
      email: normalizeEmail(session.email),
      expiresAt: session.expiresAt ?? Date.now() + thirtyDaysMs,
    };
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

/**
 * Googleログインセッションをクリア（ログアウト）する
 */
export function clearGoogleSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    const win = window as unknown as {
      google?: { accounts?: { id?: { disableAutoSelect?: () => void } } };
    };
    win.google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    // ignore
  }
}

/**
 * 保存済みの管理者（Admin）Googleログインセッションを取得する
 * 一般ユーザーセッションとは別のキーで独立保持されます
 */
export function getSavedAdminGoogleSession(): GoogleAuthSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: GoogleAuthSession = JSON.parse(raw);
    if (!session || !session.email) return null;

    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(ADMIN_AUTH_SESSION_STORAGE_KEY);
      return null;
    }

    return {
      ...session,
      email: normalizeEmail(session.email),
    };
  } catch {
    return null;
  }
}

/**
 * 管理者（Admin）Googleログインセッションを保存する
 */
export function saveAdminGoogleSession(session: GoogleAuthSession): void {
  try {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const toSave: GoogleAuthSession = {
      ...session,
      email: normalizeEmail(session.email),
      expiresAt: session.expiresAt ?? Date.now() + thirtyDaysMs,
    };
    localStorage.setItem(
      ADMIN_AUTH_SESSION_STORAGE_KEY,
      JSON.stringify(toSave)
    );
  } catch {
    // ignore
  }
}

/**
 * 管理者（Admin）Googleログインセッションをクリア（ログアウト）する
 */
export function clearAdminGoogleSession(): void {
  try {
    localStorage.removeItem(ADMIN_AUTH_SESSION_STORAGE_KEY);
    const win = window as unknown as {
      google?: { accounts?: { id?: { disableAutoSelect?: () => void } } };
    };
    win.google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    // ignore
  }
}

let gsiScriptPromise: Promise<void> | null = null;

/**
 * Google Identity Services (https://accounts.google.com/gsi/client) スクリプトを動的に読み込む
 */
export function loadGoogleIdentityScript(): Promise<void> {
  const win = window as unknown as {
    google?: { accounts?: { id?: unknown } };
  };
  if (win.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (gsiScriptPromise) {
    return gsiScriptPromise;
  }

  gsiScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Google認証スクリプトの読み込みに失敗しました'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiScriptPromise = null;
      reject(new Error('Google認証スクリプトの読み込みに失敗しました'));
    };
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
}
