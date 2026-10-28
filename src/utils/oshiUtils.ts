import type { Oshi, OshiEvent } from '../types';

export const PRESET_OSHI_COLORS: { hex: string; name: string }[] = [
  { hex: '#FF2D55', name: 'ビビッドピンク' },
  { hex: '#FF3B30', name: 'レッド' },
  { hex: '#FF9500', name: 'オレンジ' },
  { hex: '#FFCC00', name: 'イエロー' },
  { hex: '#34C759', name: 'グリーン' },
  { hex: '#00C7BE', name: 'エメラルド' },
  { hex: '#007AFF', name: 'ブルー' },
  { hex: '#AF52DE', name: 'パープル' },
  { hex: '#8E8E93', name: 'シルバー/グレー' },
  { hex: '#1C1C1E', name: 'ブラック' },
];

export function getTodayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseLocalDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;

export function getWeekdayJa(date: Date): string {
  return WEEKDAYS_JA[date.getDay()];
}

export function getDaysUntilDate(dateStr: string): number {
  const target = parseLocalDate(dateStr);
  if (!target) return 0;
  const today = getTodayMidnight();
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function isTodayDate(dateStr: string): boolean {
  return getDaysUntilDate(dateStr) === 0;
}

export function timeToMinutes(time?: string): number {
  if (!time || !time.trim()) return 9999;
  const parts = time.split(':');
  if (parts.length !== 2) return 9999;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return 9999;
  return h * 60 + m;
}

export function sortEventsByTime(list: OshiEvent[]): OshiEvent[] {
  return [...list].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

export function sortEventsByDateAndTime(list: OshiEvent[]): OshiEvent[] {
  return [...list].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });
}

export function isEventEnded(event: OshiEvent): boolean {
  if (event.isFinished) return true;
  const days = getDaysUntilDate(event.date);
  if (days < 0) return true; // 過去日
  if (days === 0 && event.time) {
    // 本日の場合、指定時刻を過ぎていれば終了とみなす
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const eventMins = timeToMinutes(event.time);
    return currentMins >= eventMins;
  }
  return false;
}

// Oshi helpers (ported from oshi_models.dart)
export function getOshiSinceDateStr(oshi: Oshi): string | undefined {
  return oshi.sinceDate || oshi.debutDate;
}

export function getOshiDaysSince(oshi: Oshi): number | null {
  const sinceStr = getOshiSinceDateStr(oshi);
  const since = parseLocalDate(sinceStr);
  if (!since) return null;
  const today = getTodayMidnight();
  const diff = Math.round((today.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

export function getDaysUntilBirthday(oshi: Oshi): number | null {
  const bday = parseLocalDate(oshi.birthday);
  if (!bday) return null;
  const today = getTodayMidnight();
  let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (next.getTime() < today.getTime()) {
    next = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
  }
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isBirthdayToday(oshi: Oshi): boolean {
  return getDaysUntilBirthday(oshi) === 0;
}

export function getDaysUntilDebut(oshi: Oshi): number | null {
  const debut = parseLocalDate(oshi.debutDate);
  if (!debut) return null;
  const today = getTodayMidnight();
  let next = new Date(today.getFullYear(), debut.getMonth(), debut.getDate());
  if (next.getTime() < today.getTime()) {
    next = new Date(today.getFullYear() + 1, debut.getMonth(), debut.getDate());
  }
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDebutYears(oshi: Oshi): number | null {
  const debut = parseLocalDate(oshi.debutDate);
  if (!debut) return null;
  const today = getTodayMidnight();
  let next = new Date(today.getFullYear(), debut.getMonth(), debut.getDate());
  if (next.getTime() < today.getTime()) {
    next = new Date(today.getFullYear() + 1, debut.getMonth(), debut.getDate());
  }
  const years = next.getFullYear() - debut.getFullYear();
  return years > 0 ? years : 1;
}

export function isDebutAnniversaryToday(oshi: Oshi): boolean {
  return getDaysUntilDebut(oshi) === 0;
}

export interface EventCountdownInfo {
  heroBadge: string;
  hoursLabel: string;
  shortCountdown: string;
}

export interface EventLiveCountdown {
  isEnded: boolean;
  isStarted: boolean;
  isAllDay: boolean;
  hasTime: boolean;
  formatted: string;
  label: string;
  shortBadge: string;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * 毎秒リアルタイムに動くカウントダウン情報を計算する
 */
export function getEventLiveCountdown(
  event: OshiEvent,
  now: Date = new Date()
): EventLiveCountdown {
  const d = parseLocalDate(event.date);
  if (!d) {
    return {
      isEnded: false,
      isStarted: false,
      isAllDay: true,
      hasTime: false,
      formatted: '',
      label: '日時未定',
      shortBadge: '',
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
    };
  }

  const rawTime = event.time?.trim();
  if (!rawTime || !rawTime.includes(':')) {
    const today = isTodayDate(event.date);
    return {
      isEnded: isEventEnded(event),
      isStarted: today,
      isAllDay: true,
      hasTime: false,
      formatted: today ? '本日開催' : '',
      label: today ? '本日開催（終日）' : '終日開催',
      shortBadge: today ? '本日' : '',
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
    };
  }

  const [hStr, mStr] = rawTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) {
    return {
      isEnded: isEventEnded(event),
      isStarted: false,
      isAllDay: true,
      hasTime: false,
      formatted: '',
      label: '時間未設定',
      shortBadge: '',
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
    };
  }

  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec <= 0) {
    return {
      isEnded: isEventEnded(event),
      isStarted: true,
      isAllDay: false,
      hasTime: true,
      formatted: '開始済',
      label: '開始済（進行中）',
      shortBadge: '開催中',
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
    };
  }

  const hours = Math.floor(diffSec / 3600);
  const remSec = diffSec % 3600;
  const minutes = Math.floor(remSec / 60);
  const seconds = remSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}時間${pad(minutes)}分${pad(seconds)}秒`;
  } else if (minutes > 0) {
    formatted = `${minutes}分${pad(seconds)}秒`;
  } else {
    formatted = `${seconds}秒`;
  }

  return {
    isEnded: false,
    isStarted: false,
    isAllDay: false,
    hasTime: true,
    formatted,
    label: `開始まで あと ${formatted}`,
    shortBadge: `あと ${formatted}`,
    hours,
    minutes,
    seconds,
    totalSeconds: diffSec,
  };
}

export function getEventCountdownInfo(
  event: OshiEvent,
  now: Date = new Date()
): EventCountdownInfo {
  const d = parseLocalDate(event.date);
  if (!d) {
    return {
      heroBadge: '',
      hoursLabel: '',
      shortCountdown: '',
    };
  }

  const today = isTodayDate(event.date);
  const calendarDays = getDaysUntilDate(event.date);

  const rawTime = event.time?.trim();
  if (rawTime && rawTime.includes(':')) {
    const [hStr, mStr] = rawTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!isNaN(h) && !isNaN(m)) {
      const target = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        h,
        m,
        0
      );
      const diffMs = target.getTime() - now.getTime();

      if (diffMs <= 0) {
        return {
          heroBadge: today ? 'TODAY' : '終了',
          hoursLabel: today ? '開始済' : '終了',
          shortCountdown: today ? '開始済' : '終了',
        };
      }

      const totalMinutes = Math.ceil(diffMs / (1000 * 60));
      const totalHours = Math.floor(totalMinutes / 60);
      const remMinutes = totalMinutes % 60;
      const fullDays = Math.floor(totalHours / 24);
      const remHours = totalHours % 24;

      if (today || totalHours < 24) {
        const timeText =
          totalHours > 0
            ? remMinutes > 0
              ? `${totalHours}時間${remMinutes}分`
              : `${totalHours}時間`
            : `${remMinutes}分`;
        return {
          heroBadge: today ? `あと ${timeText}` : `あと ${calendarDays} 日`,
          hoursLabel: `開始まで あと ${timeText}`,
          shortCountdown: `あと${timeText}`,
        };
      }

      return {
        heroBadge: `あと ${calendarDays} 日`,
        hoursLabel: `開始まで あと ${totalHours}時間 (${fullDays}日${remHours > 0 ? `${remHours}時間` : ''})`,
        shortCountdown: `あと${totalHours}時間`,
      };
    }
  }

  // 時間未設定（終日）の場合
  if (today) {
    return {
      heroBadge: 'TODAY',
      hoursLabel: '本日開催（終日）',
      shortCountdown: '本日',
    };
  }

  const targetMidnight = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    0,
    0,
    0
  );
  const diffMs = targetMidnight.getTime() - now.getTime();
  const approxHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

  return {
    heroBadge: `あと ${calendarDays} 日`,
    hoursLabel: `当日まで あと 約${approxHours}時間`,
    shortCountdown: `あと約${approxHours}時間`,
  };
}

/**
 * 画像ファイルをリサイズしてBase64データURLに変換（IndexedDBへ高速・大容量保存用）
 */
export function resizeAndConvertImageToBase64(
  file: File,
  maxDimension = 900,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('画像の解析に失敗しました'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}



