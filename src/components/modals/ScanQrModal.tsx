import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../common/Modal';
import { parseSyncData } from '../../utils/syncUtils';
import { useApp } from '../../context/AppContext';
import type { BackupData } from '../../types';
import { Camera, AlertCircle, Clipboard, Check, ArrowRight } from 'lucide-react';

interface ScanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: BackupData) => void;
}

export const ScanQrModal: React.FC<ScanQrModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'camera' | 'paste'>('camera');
  const [pastedText, setPastedText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // カメラ初期化（カメラタブ表示時のみ）
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => html5QrCodeRef.current?.clear()).catch(() => {});
      }
      setIsCameraActive(false);
      return;
    }

    const qrRegionId = 'qr-reader-region';
    setErrorMessage(null);

    let isScanning = true;
    const scanner = new Html5Qrcode(qrRegionId);
    html5QrCodeRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isScanning) return;
            isScanning = false;

            const parsed = parseSyncData(decodedText);
            if (parsed) {
              scanner
                .stop()
                .then(() => scanner.clear())
                .catch(() => {});
              onSuccess(parsed);
              onClose();
            } else {
              showToast('推しサポの同期用QRコードではありません', 'error');
              setTimeout(() => {
                isScanning = true;
              }, 2000);
            }
          },
          () => {}
        );
        setIsCameraActive(true);
      } catch (err) {
        console.error('Camera start failed:', err);
        setErrorMessage(
          'カメラの起動に失敗しました。「コード貼り付け」タブをお試しいただくか、スマホの通常カメラでQRを読み取ってください。'
        );
      }
    };

    const timer = setTimeout(startScanner, 200);

    return () => {
      isScanning = false;
      clearTimeout(timer);
      if (scanner && scanner.isScanning) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [isOpen, activeTab, onClose, onSuccess, showToast]);

  const handleExecutePaste = () => {
    if (!pastedText.trim()) {
      showToast('同期コードまたはURLを貼り付けてください', 'error');
      return;
    }
    const parsed = parseSyncData(pastedText);
    if (parsed) {
      onSuccess(parsed);
      onClose();
    } else {
      showToast('有効な同期データが見つかりませんでした。コードをもう一度ご確認ください。', 'error');
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPastedText(text);
        const parsed = parseSyncData(text);
        if (parsed) {
          onSuccess(parsed);
          onClose();
          return;
        }
        showToast('クリップボードの内容を貼り付けました', 'info');
      } else {
        showToast('クリップボードが空です', 'error');
      }
    } catch {
      showToast('下の枠に直接貼り付け（⌘+V または 右クリック）してください', 'info');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="データを同期（読み取り / 貼り付け）" maxWidth="md">
      <div className="space-y-4 py-1">
        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-[#1a1c28] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-[#252838] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>カメラでスキャン</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-[#252838] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>コード貼り付け（PC推奨）</span>
          </button>
        </div>

        {/* Tab 1: Camera Scan */}
        {activeTab === 'camera' && (
          <div className="space-y-3 text-center">
            {errorMessage ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 text-left space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>カメラを起動できませんでした</span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
                >
                  コード貼り付けに切り替える
                </button>
              </div>
            ) : (
              <div>
                <div className="relative mx-auto w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-gray-200 dark:border-[#35384d] shadow-inner">
                  <div id="qr-reader-region" className="w-full h-full" />
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/60 gap-2">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">カメラを起動中...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  相手の端末の「同期用QRコード」を枠内に収めてください
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  ※ PCカメラで合わせにくい場合は、上の「コード貼り付け」が便利です。
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Paste Code / URL (PC Recommended) */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/40 p-3 rounded-xl text-xs text-sky-800 dark:text-sky-200 leading-relaxed space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>💡 カメラ不要でかんたん同期</span>
              </p>
              <p className="text-[11px] text-sky-700 dark:text-sky-300">
                スマホ側で<strong>「同期用URLをコピー」</strong>を押したあと、このPCで貼り付けるだけで直接データを同期できます！（MacとiPhoneなら自動で共有されます）
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  同期コード または URL
                </label>
                <button
                  type="button"
                  onClick={handleClipboardPaste}
                  className="text-xs text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>クリップボードから貼付</span>
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="https://toku0716.github.io/oshi_web/#sync=... などを貼り付け"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-[#35384d] bg-white dark:bg-[#1a1b26] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 font-mono resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleExecutePaste}
              className="w-full py-2.5 px-4 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              <span>このコードで同期を実行</span>
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 dark:border-[#262838]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#202230] text-gray-700 dark:text-gray-200 text-xs font-semibold transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </Modal>
  );
};
