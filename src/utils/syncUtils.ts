import LZString from 'lz-string';
import type { BackupData } from '../types';

/**
 * データをURLエンコード圧縮し、QRコード用の同期URLを生成します。
 * QRコードの最大データ容量（約2KB〜3KB）に収まるよう、必要に応じて画像を軽量化します。
 */
export function generateSyncUrl(backupData: BackupData): { url: string; size: number; isOptimized: boolean } {
  // まずフルデータで試行
  const fullJson = JSON.stringify(backupData);
  let compressed = LZString.compressToEncodedURIComponent(fullJson);

  let isOptimized = false;
  // QRコードとして安定して読み取れるサイズは約2000文字以内
  if (compressed.length > 2200) {
    isOptimized = true;
    // 画像などの大容量フィールドを除外した軽量データを作成
    const lightweightData: BackupData = {
      ...backupData,
      data: {
        ...backupData.data,
        oshis: backupData.data.oshis.map((o) => ({ ...o, image: undefined })),
        goods: backupData.data.goods.map((g) => ({ ...g, image: undefined })),
      },
    };
    const lightJson = JSON.stringify(lightweightData);
    compressed = LZString.compressToEncodedURIComponent(lightJson);
  }

  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}#sync=${compressed}`;

  return {
    url,
    size: compressed.length,
    isOptimized,
  };
}

/**
 * URLハッシュから同期データを解凍・パースします。
 */
export function parseSyncDataFromHash(hash: string): BackupData | null {
  if (!hash || !hash.includes('#sync=')) return null;

  try {
    const rawCompressed = hash.split('#sync=')[1];
    if (!rawCompressed) return null;

    const decompressed = LZString.decompressFromEncodedURIComponent(rawCompressed);
    if (!decompressed) return null;

    const parsed = JSON.parse(decompressed);
    if (parsed && typeof parsed === 'object' && parsed.app === 'oshiss' && parsed.data) {
      return parsed as BackupData;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse sync data from hash:', err);
    return null;
  }
}
