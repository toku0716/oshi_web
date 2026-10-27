/**
 * Calculates days between today and targetDate (YYYY-MM-DD)
 * Positive: future days
 * 0: today
 * Negative: past days
 */
export function getDaysDiff(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = targetDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return 0;
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates how many days since the fan started following (YYYY-MM-DD)
 * "推し始めて◯日目" (Starting day is Day 1)
 */
export function getDaysSince(startDateStr?: string): number {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - start.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, days + 1);
}

/**
 * Calculates the next Oshi-katsu anniversary milestone (100日, 1周年, 500日, 1000日, etc.)
 */
export function getNextMilestone(daysSince: number): {
  targetDays: number;
  label: string;
  daysRemaining: number;
  progressPercent: number;
  isTodayMilestone: boolean;
} {
  const milestones: { days: number; label: string }[] = [
    { days: 30, label: '推し歴30日' },
    { days: 50, label: '推し歴50日' },
    { days: 100, label: '100日記念' },
    { days: 200, label: '200日記念' },
    { days: 300, label: '300日記念' },
    { days: 365, label: '1周年記念' },
    { days: 500, label: '500日記念' },
    { days: 730, label: '2周年記念' },
    { days: 1000, label: '1000日記念' },
    { days: 1095, label: '3周年記念' },
    { days: 1460, label: '4周年記念' },
    { days: 1500, label: '1500日記念' },
    { days: 1825, label: '5周年記念' },
    { days: 2000, label: '2000日記念' },
    { days: 2500, label: '2500日記念' },
    { days: 3000, label: '3000日記念' },
    { days: 3650, label: '10周年記念' },
  ];

  // Check if today is an exact milestone
  const exact = milestones.find((m) => m.days === daysSince);
  if (exact) {
    return {
      targetDays: exact.days,
      label: exact.label,
      daysRemaining: 0,
      progressPercent: 100,
      isTodayMilestone: true,
    };
  }

  let prevDays = 0;
  for (const m of milestones) {
    if (daysSince < m.days) {
      const span = m.days - prevDays;
      const currentInSpan = daysSince - prevDays;
      const progressPercent = Math.min(99, Math.max(5, Math.round((currentInSpan / span) * 100)));
      return {
        targetDays: m.days,
        label: m.label,
        daysRemaining: m.days - daysSince,
        progressPercent,
        isTodayMilestone: false,
      };
    }
    prevDays = m.days;
  }

  // Fallback for > 3650 days: next 500-day increment
  const nextFiveHundred = Math.ceil((daysSince + 1) / 500) * 500;
  const prevFiveHundred = nextFiveHundred - 500;
  const progressPercent = Math.min(
    99,
    Math.max(5, Math.round(((daysSince - prevFiveHundred) / 500) * 100))
  );
  return {
    targetDays: nextFiveHundred,
    label: `${nextFiveHundred}日記念`,
    daysRemaining: nextFiveHundred - daysSince,
    progressPercent,
    isTodayMilestone: false,
  };
}

/**
 * Formats YYYY-MM-DD into Japanese localized string with day of week
 */
export function formatJapaneseDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const day = weekdays[d.getDay()];

  return `${month}月${date}日(${day})`;
}

/**
 * Format currency in JPY (¥1,800)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
}

/**
 * Reads an image File, optionally resizes it via HTML5 Canvas, and returns Base64 data URL
 * This ensures lightweight storage in IndexedDB and snappy JSON export/import.
 */
export function resizeAndConvertImageToBase64(file: File, maxDimension = 800, quality = 0.85): Promise<string> {
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
