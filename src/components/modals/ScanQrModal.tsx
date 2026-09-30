import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../common/Modal';
import { parseSyncData } from '../../utils/syncUtils';
import { useApp } from '../../context/AppContext';
import type { BackupData } from '../../types';
import { Camera, AlertCircle } from 'lucide-react';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) return;

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
          () => {
            // フレーム毎の読み取り失敗は無視
          }
        );
        setIsCameraActive(true);
      } catch (err) {
        console.error('Camera start failed:', err);
        setErrorMessage(
          'カメラの起動に失敗しました。ブラウザのカメラ許可をご確認いただくか、スマホの標準カメラアプリでQRコードを読み取ってください。'
        );
      }
    };

    // DOM要素のレンダリングを少し待ってから開始
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
  }, [isOpen, onClose, onSuccess, showToast]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="カメラでQRコードをスキャン" maxWidth="md">
      <div className="space-y-4 py-1 text-center">
        {errorMessage ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 text-left space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>カメラを起動できませんでした</span>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
              {errorMessage}
            </p>
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
              もう片方の端末の画面に表示された「同期用QRコード」を枠内に収めてください
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#202230] text-gray-700 dark:text-gray-200 text-xs font-semibold transition"
          >
            キャンセル
          </button>
        </div>
      </div>
    </Modal>
  );
};
