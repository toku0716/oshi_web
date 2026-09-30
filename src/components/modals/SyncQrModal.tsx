import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { backupRepository } from '../../repository';
import { generateSyncUrl } from '../../utils/syncUtils';
import { useApp } from '../../context/AppContext';
import { QrCode, Copy, Check, Info } from 'lucide-react';

interface SyncQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncQrModal: React.FC<SyncQrModalProps> = ({ isOpen, onClose }) => {
  const { oshis, events, goods, showToast } = useApp();
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [isOptimized, setIsOptimized] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    backupRepository
      .exportBackup()
      .then((backupData) => {
        if (!isMounted) return;
        const result = generateSyncUrl(backupData);
        setSyncUrl(result.url);
        setIsOptimized(result.isOptimized);
      })
      .catch((err) => {
        console.error(err);
        showToast('同期用QRコードの生成に失敗しました', 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, showToast]);

  const handleCopyUrl = async () => {
    if (!syncUrl) return;
    try {
      await navigator.clipboard.writeText(syncUrl);
      setIsCopied(true);
      showToast('同期用URLをコピーしました', 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast('URLのコピーに失敗しました', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QRコードでデータを送る" maxWidth="md">
      <div className="space-y-5 py-1 text-center">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">同期データを準備中...</p>
          </div>
        ) : (
          <>
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm inline-block">
                {syncUrl ? (
                  <QRCodeSVG
                    value={syncUrl}
                    size={220}
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-55 h-55 flex items-center justify-center text-xs text-gray-400">
                    QRコードを生成できませんでした
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-3">
                同期先のスマホ（またはPC）のカメラで読み取ってください
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                スマートフォンの通常の「カメラ」アプリでかざすだけで同期画面が開きます。
              </p>
            </div>

            {/* Sync Data Summary */}
            <div className="bg-gray-50 dark:bg-[#1a1c28] p-3 rounded-xl border border-gray-200 dark:border-[#35384d] text-xs flex items-center justify-around">
              <div>
                <span className="text-[11px] text-gray-400 block">推し</span>
                <strong className="text-sm font-bold text-gray-800 dark:text-gray-200">{oshis.length}人</strong>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-[#35384d]" />
              <div>
                <span className="text-[11px] text-gray-400 block">予定</span>
                <strong className="text-sm font-bold text-gray-800 dark:text-gray-200">{events.length}件</strong>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-[#35384d]" />
              <div>
                <span className="text-[11px] text-gray-400 block">グッズ</span>
                <strong className="text-sm font-bold text-gray-800 dark:text-gray-200">{goods.length}点</strong>
              </div>
            </div>

            {/* Note about large images */}
            {isOptimized && (
              <div className="text-left bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 p-3 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="leading-relaxed">
                  ※ データ容量が大きいため、QRコード内では写真画像を除外してテキスト情報（推し・予定・グッズ）を優先同期しています。写真も含めて丸ごと移したい場合は、マイページの「バックアップをダウンロード（ファイル）」をご利用ください。
                </p>
              </div>
            )}

            {/* URL Copy Option */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex-1 py-2 px-3 rounded-lg border border-gray-300 dark:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#202230] text-gray-700 dark:text-gray-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>コピー完了！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>同期用URLをコピー</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-semibold transition"
              >
                閉じる
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
