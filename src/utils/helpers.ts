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
