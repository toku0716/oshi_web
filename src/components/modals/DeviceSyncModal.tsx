import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import {
  Smartphone,
  Monitor,
  ArrowRightLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { backupRepository } from '../../repository';
import { useDialog } from '../../hooks/useDialog';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'select' | 'send' | 'receive';
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'select',
}) => {
  const { themeColor, showToast, refreshAllData, isDark } = useApp();

  const [mode, setMode] = useState<'select' | 'send' | 'receive'>(initialMode);
  const [step, setStep] = useState<'idle' | 'connecting' | 'transferring' | 'done' | 'error'>('idle');
  const [syncCode, setSyncCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [syncDetails, setSyncDetails] = useState<{
    oshisCount: number;
    eventsCount: number;
    todosCount: number;
    goodsCount: number;
  } | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const cleanupPeer = useCallback(() => {
    if (connRef.current) {
      try {
        connRef.current.close();
      } catch {}
      connRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {}
      peerRef.current = null;
    }
  }, []);

  const handleClose = () => {
    cleanupPeer();
    setMode('select');
    setStep('idle');
    setSyncCode('');
    setInputCode('');
    setErrorMessage('');
    setSyncDetails(null);
    onClose();
  };

  const dialogRef = useDialog<HTMLDivElement>(isOpen, handleClose);

  // 送信モード開始
  const startSend = useCallback(() => {
    cleanupPeer();
    setMode('send');
    setStep('connecting');
    setErrorMessage('');
    setSyncDetails(null);

    // 6桁のランダムな数字
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSyncCode(code);

    const peerId = `oshisapo-${code}`;
    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      setStep('idle');
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
            showToast('相手端末へのデータ送信が完了しました！✨', 'success');
          }, 800);
        } catch (err) {
          console.error(err);
          setErrorMessage('データの送信処理に失敗しました');
          setStep('error');
        }
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      if (err.type === 'unavailable-id') {
        // 重複時は再試行
        setTimeout(() => startSend(), 300);
      } else {
        setErrorMessage('接続の待機に失敗しました。ネットワーク環境をご確認ください。');
        setStep('error');
      }
    });
  }, [cleanupPeer, showToast]);

  // 受信モード開始
  const startReceive = useCallback((prefillCode?: string) => {
    cleanupPeer();
    setMode('receive');
    setStep('idle');
    setInputCode(prefillCode || '');
    setErrorMessage('');
    setSyncDetails(null);
  }, [cleanupPeer]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialMode === 'send') {
      startSend();
    } else if (initialMode === 'receive') {
      startReceive();
    }
  }, [isOpen, initialMode, startSend, startReceive]);

  // 受信実行
  const executeReceive = () => {
    const trimmed = inputCode.trim().replace(/\D/g, '');
    if (trimmed.length !== 6) {
      showToast('6桁の数字を入力してください', 'error');
      return;
    }

    cleanupPeer();
    setStep('connecting');
    setErrorMessage('');

    const peer = new Peer();
    peerRef.current = peer;

    const timeoutTimer = setTimeout(() => {
      if (step !== 'done') {
        setErrorMessage('接続がタイムアウトしました。送信側の画面が開いているかご確認ください。');
        setStep('error');
        cleanupPeer();
      }
    }, 25000);

    peer.on('open', () => {
      const targetPeerId = `oshisapo-${trimmed}`;
      const conn = peer.connect(targetPeerId, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        setStep('transferring');
      });

      conn.on('data', async (data) => {
        clearTimeout(timeoutTimer);
        try {
          const result = await backupRepository.importBackup(data);
          await refreshAllData();
          setSyncDetails(result);
          setStep('done');
          showToast('端末間同期が完了しました！🎉', 'success');
        } catch (err) {
          console.error(err);
          setErrorMessage(err instanceof Error ? err.message : 'データの復元に失敗しました');
          setStep('error');
        } finally {
          cleanupPeer();
        }
      });
    });

    peer.on('error', (err) => {
      clearTimeout(timeoutTimer);
      console.error(err);
      setErrorMessage('接続に失敗しました。コードが正しいかご確認ください。');
      setStep('error');
      cleanupPeer();
    });
  };

  const handleCopyCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setHasCopied(true);
    showToast('認証コードをコピーしました', 'info');
    setTimeout(() => setHasCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="flutter-sheet-backdrop" style={{ zIndex: 1250 }} onClick={handleClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-modal-title"
        className="flutter-sheet"
        style={{
          maxWidth: 520,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: 24,
          padding: 0,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-elevation-high)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${themeColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColor,
              }}
            >
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 id="sync-modal-title" style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                スマホ・PC P2P直接同期
              </h2>
              <p style={{ fontSize: 11.5, margin: 0, color: 'var(--text-muted)' }}>
                サーバーを介さず端末間で直接暗号化通信して同期
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="閉じる"
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {/* モード選択画面 */}
          {mode === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  backgroundColor: isDark ? '#23262F' : 'var(--bg-surface)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid var(--border-subtle)',
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                🔐 <strong>WebRTC P2P通信</strong>により、クラウドサーバーにデータを預けることなく、手元のスマホとパソコンの間で推し活データを安全・瞬時に同期します。
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={startSend}
                  style={{
                    padding: '20px 14px',
                    borderRadius: 18,
                    border: isDark ? `2px solid ${themeColor}` : `1.5px solid ${themeColor}44`,
                    backgroundColor: isDark ? '#23262F' : `${themeColor}10`,
                    boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: themeColor,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Monitor size={24} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                      この端末から送る
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      6桁コードを発行
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => startReceive()}
                  style={{
                    padding: '20px 14px',
                    borderRadius: 18,
                    border: isDark ? '1.5px solid rgba(255, 255, 255, 0.18)' : '1.5px solid var(--border-subtle)',
                    backgroundColor: isDark ? '#252830' : 'var(--bg-surface)',
                    boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: isDark ? '#2F333E' : 'var(--bg-surface-elevated)',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid var(--border-medium)',
                      color: themeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Smartphone size={24} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                      この端末で受け取る
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      コードを入力して同期
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 送信モード */}
          {mode === 'send' && (
            <div>
              {step === 'done' ? (
                <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: `${themeColor}20`,
                      color: themeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    送信が完了しました！
                  </h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                    受信端末に最新の推し活データが正常に同期されました。
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: themeColor,
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    閉じる
                  </button>
                </div>
              ) : step === 'error' ? (
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                  <AlertCircle size={36} color="var(--color-danger)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--color-danger)', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                    {errorMessage}
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setMode('select')}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 10,
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid var(--border-subtle)',
                        backgroundColor: isDark ? '#252830' : 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      戻る
                    </button>
                    <button
                      type="button"
                      onClick={startSend}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 10,
                        border: 'none',
                        backgroundColor: themeColor,
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      再試行
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 16px' }}>
                    受信側の端末で以下の<strong>6桁認証コードを入力</strong>してください:
                  </p>

                  {/* 6桁コード */}
                  <div
                    onClick={handleCopyCode}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 24px',
                      borderRadius: 18,
                      backgroundColor: isDark ? '#23262F' : `${themeColor}15`,
                      border: isDark ? `2px dashed ${themeColor}` : `2px dashed ${themeColor}`,
                      boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : 'none',
                      cursor: 'pointer',
                      marginBottom: 16,
                      transition: 'transform 0.1s ease',
                    }}
                    title="タップしてコードをコピー"
                  >
                    <span
                      style={{
                        fontSize: 32,
                        fontWeight: 900,
                        letterSpacing: '0.18em',
                        color: themeColor,
                        fontFamily: 'monospace',
                      }}
                    >
                      {syncCode ? `${syncCode.slice(0, 3)} - ${syncCode.slice(3, 6)}` : '発行中...'}
                    </span>
                    {hasCopied ? <Check size={20} color={themeColor} /> : <Copy size={20} color={themeColor} />}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginBottom: 20,
                    }}
                  >
                    {step === 'transferring' ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>データ転送中...</span>
                      </>
                    ) : (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>相手端末からの接続待機中...</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      cleanupPeer();
                      setMode('select');
                    }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 10,
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid var(--border-subtle)',
                      backgroundColor: isDark ? '#252830' : 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ← 戻る
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 受信モード */}
          {mode === 'receive' && (
            <div>
              {step === 'done' ? (
                <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: `${themeColor}20`,
                      color: themeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    同期が完了しました！🎉
                  </h3>
                  {syncDetails && (
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                      推し {syncDetails.oshisCount}件 / 予定 {syncDetails.eventsCount}件 / TODO {syncDetails.todosCount}件 / グッズ {syncDetails.goodsCount}件 を反映しました。
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: themeColor,
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    完了
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <KeyRound size={28} color={themeColor} style={{ margin: '0 auto 8px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 4px' }}>
                      送信側の画面に表示されている<strong>6桁の認証コード</strong>を入力してください:
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="123456"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                      disabled={step === 'connecting' || step === 'transferring'}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: '0.2em',
                        padding: '12px 16px',
                        borderRadius: 14,
                        border: `2px solid ${inputCode.length === 6 ? themeColor : isDark ? 'rgba(255, 255, 255, 0.22)' : 'var(--border-medium)'}`,
                        backgroundColor: isDark ? '#23262F' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                      }}
                      autoFocus
                    />
                  </div>

                  {errorMessage && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                        color: 'var(--color-danger)',
                        fontSize: 12.5,
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      {errorMessage}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        cleanupPeer();
                        setMode('select');
                      }}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 12,
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid var(--border-subtle)',
                        backgroundColor: isDark ? '#252830' : 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      戻る
                    </button>
                    <button
                      type="button"
                      onClick={executeReceive}
                      disabled={inputCode.length !== 6 || step === 'connecting' || step === 'transferring'}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: 12,
                        border: 'none',
                        backgroundColor: themeColor,
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: inputCode.length === 6 ? 'pointer' : 'not-allowed',
                        opacity: inputCode.length === 6 ? 1 : 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: `0 4px 14px ${themeColor}40`,
                      }}
                    >
                      {step === 'connecting' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>接続中...</span>
                        </>
                      ) : step === 'transferring' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>データ受信・反映中...</span>
                        </>
                      ) : (
                        <span>受信して同期</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
