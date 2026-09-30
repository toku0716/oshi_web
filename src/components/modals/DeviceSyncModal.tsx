import React, { useState, useEffect, useRef } from 'react';
import { Peer, type DataConnection } from 'peerjs';
import { Modal } from '../common/Modal';
import { backupRepository } from '../../repository';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  Laptop,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Download,
  ArrowLeft,
} from 'lucide-react';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'send' | 'receive' | null;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  defaultMode = null,
}) => {
  const { refreshAllData, showToast } = useApp();

  const [mode, setMode] = useState<'select' | 'send' | 'receive'>('select');
  const [step, setStep] = useState<'idle' | 'connecting' | 'transferring' | 'done' | 'error'>('idle');
  const [syncCode, setSyncCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  // モーダルを開いたときの初期化
  useEffect(() => {
    if (!isOpen) {
      cleanupPeer();
      setMode('select');
      setStep('idle');
      setSyncCode('');
      setInputCode('');
      setErrorMessage('');
      return;
    }

    if (defaultMode) {
      if (defaultMode === 'send') startSend();
      if (defaultMode === 'receive') startReceive();
    }
  }, [isOpen, defaultMode]);

  const cleanupPeer = () => {
    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  // ==============================
  // 送信側の処理（この端末から送る）
  // ==============================
  const startSend = () => {
    cleanupPeer();
    setMode('send');
    setStep('connecting');
    setErrorMessage('');

    // ランダムな6桁の数字を生成
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSyncCode(code);

    const peerId = `oshisapo-${code}`;
    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      setStep('idle'); // 待機中
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setStep('transferring');

      conn.on('open', async () => {
        try {
          const backup = await backupRepository.exportBackup();
          conn.send(backup);
          setTimeout(() => {
            setStep('done');
            showToast('データを相手の端末に送信しました！', 'success');
          }, 800);
        } catch (err) {
          console.error(err);
          setErrorMessage('データの送信に失敗しました');
          setStep('error');
        }
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      if (err.type === 'unavailable-id') {
        // 万が一番号が重複した場合は再生成
        startSend();
      } else {
        setErrorMessage('接続の待機に失敗しました。もう一度お試しください。');
        setStep('error');
      }
    });
  };

  // ==============================
  // 受信側の処理（この端末で受け取る）
  // ==============================
  const startReceive = () => {
    cleanupPeer();
    setMode('receive');
    setStep('idle');
    setInputCode('');
    setErrorMessage('');
  };

  const executeReceive = () => {
    const trimmed = inputCode.trim().replace(/\D/g, '');
    if (trimmed.length !== 6) {
      showToast('6桁の数字を入力してください', 'error');
      return;
    }

    cleanupPeer();
    setStep('connecting');
    setErrorMessage('');

    // 受信側はランダムなIDで初期化
    const peer = new Peer();
    peerRef.current = peer;

    const timeoutTimer = setTimeout(() => {
      if (step !== 'done') {
        setErrorMessage('接続がタイムアウトしました。相手の画面が開いているかご確認ください。');
        setStep('error');
        cleanupPeer();
      }
    }, 20000);

    peer.on('open', () => {
      const targetPeerId = `oshisapo-${trimmed}`;
      const conn = peer.connect(targetPeerId, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        clearTimeout(timeoutTimer);
        setStep('transferring');
      });

      conn.on('data', async (data: any) => {
        try {
          if (data && data.app === 'oshiss' && data.data) {
            await backupRepository.importBackup(data);
            await refreshAllData();
            setStep('done');
            showToast('データの同期が完了しました！', 'success');
          } else {
            throw new Error('不正なデータ形式');
          }
        } catch (err) {
          console.error(err);
          setErrorMessage('データの復元に失敗しました。');
          setStep('error');
        } finally {
          cleanupPeer();
        }
      });

      conn.on('close', () => {
        clearTimeout(timeoutTimer);
      });
    });

    peer.on('error', (err) => {
      clearTimeout(timeoutTimer);
      console.error(err);
      if (err.type === 'peer-unavailable') {
        setErrorMessage('相手の端末が見つかりません。番号が正しいか、相手の画面が開いたままかご確認ください。');
      } else {
        setErrorMessage('接続に失敗しました。もう一度お試しください。');
      }
      setStep('error');
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        cleanupPeer();
        onClose();
      }}
      title="端末間のデータ同期"
      maxWidth="sm"
    >
      <div className="py-2 space-y-4">
        {/* MODE 1: 選択画面 */}
        {mode === 'select' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              パソコンとスマホの間で、6桁の数字を入力するだけでデータを同期します。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={startSend}
                className="p-4 rounded-xl border border-gray-200 dark:border-[#383e5e] bg-gray-50/70 dark:bg-[#202438] hover:border-pink-500 hover:bg-pink-50/60 dark:hover:border-pink-500 dark:hover:bg-[#282d46] text-left transition group space-y-2 flex flex-col justify-between shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                    この端末から送る
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-300 mt-0.5">
                    画面に6桁の番号を表示します
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={startReceive}
                className="p-4 rounded-xl border border-gray-200 dark:border-[#383e5e] bg-gray-50/70 dark:bg-[#202438] hover:border-indigo-500 hover:bg-indigo-50/60 dark:hover:border-indigo-500 dark:hover:bg-[#282d46] text-left transition group space-y-2 flex flex-col justify-between shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    別の端末から受け取る
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-300 mt-0.5">
                    相手の6桁の番号を入力します
                  </p>
                </div>
              </button>
            </div>

            {/* Privacy & Direct Sync Notice */}
            <div className="p-2.5 rounded-lg bg-indigo-50/90 dark:bg-[#181d33] border border-indigo-200/90 dark:border-indigo-500/40 text-[10.5px] text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed text-center">
              ※ 本アプリは、ユーザー自身の端末間でのみデータを直接同期する仕様です。データがサーバーに保存されたり、第三者に公開・共有されたりすることは一切ありません。
            </div>
          </div>
        )}

        {/* MODE 2: 送信画面（6桁の番号を表示） */}
        {mode === 'send' && (
          <div className="space-y-4 text-center">
            {step === 'done' ? (
              <div className="py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-base text-gray-900 dark:text-white">送信完了！</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  相手の端末にデータが届きました。
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-xs"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            ) : step === 'error' ? (
              <div className="py-4 space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs text-rose-600 font-semibold">{errorMessage}</p>
                <button
                  type="button"
                  onClick={startSend}
                  className="px-4 py-2 rounded-lg bg-pink-500 text-white font-semibold text-xs inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>もう一度やり直す</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    相手の端末で「受け取る」を選び、下の番号を入力してください
                  </p>
                </div>

                {/* 6桁の番号を大きく表示 */}
                <div className="py-3 px-6 rounded-2xl bg-gray-50 dark:bg-[#1a1c28] border-2 border-dashed border-pink-300 dark:border-pink-900/50 inline-block shadow-inner">
                  {syncCode ? (
                    <div className="text-3xl font-extrabold tracking-widest text-pink-600 dark:text-pink-400 font-mono">
                      {syncCode.slice(0, 3)} - {syncCode.slice(3, 6)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 py-1">番号を準備中...</div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                  <span>
                    {step === 'transferring'
                      ? 'データを転送中...'
                      : '相手の入力を待っています...'}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-[#262838]">
                  <button
                    type="button"
                    onClick={() => setMode('select')}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>戻る</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 3: 受信画面（6桁の番号を入力） */}
        {mode === 'receive' && (
          <div className="space-y-4 text-center">
            {step === 'done' ? (
              <div className="py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-base text-gray-900 dark:text-white">同期完了！</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  データが最新の内容に更新されました。
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-xs"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    相手の画面に表示されている「6桁の番号」を入力してください
                  </p>
                </div>

                {/* 入力欄 */}
                <div className="max-w-[220px] mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                    disabled={step === 'connecting' || step === 'transferring'}
                    className="w-full text-center py-2.5 px-4 text-2xl font-bold font-mono tracking-widest rounded-xl border-2 border-gray-300 dark:border-[#35384d] focus:border-indigo-500 focus:outline-none bg-white dark:bg-[#1a1c28] text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
                )}

                <div>
                  <button
                    type="button"
                    onClick={executeReceive}
                    disabled={inputCode.length !== 6 || step === 'connecting' || step === 'transferring'}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {step === 'connecting' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>相手を探しています...</span>
                      </>
                    ) : step === 'transferring' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>データを受信中...</span>
                      </>
                    ) : (
                      <>
                        <span>データを受信して同期する</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-[#262838]">
                  <button
                    type="button"
                    onClick={() => setMode('select')}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>戻る</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
