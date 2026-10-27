import React, { useState, useEffect, useRef } from 'react';
import { Peer, type DataConnection } from 'peerjs';
import { Modal } from '../common/Modal';
import { backupRepository } from '../../repository';
import { useApp } from '../../context/AppContext';

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

  const startSend = () => {
    cleanupPeer();
    setMode('send');
    setStep('connecting');
    setErrorMessage('');

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
            showToast('データを相手の端末に送信しました', 'success');
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
        startSend();
      } else {
        setErrorMessage('接続の待機に失敗しました。もう一度お試しください。');
        setStep('error');
      }
    });
  };

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
            showToast('データの同期が完了しました', 'success');
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
        setErrorMessage('相手の端末が見つかりません。番号が正しいかご確認ください。');
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
      title="デバイス間直接同期 (P2P)"
    >
      <div className="form-stack">
        {mode === 'select' && (
          <div className="form-stack">
            <p className="text-muted">
              2台のデバイス間で直接データを同期します。中継サーバーにデータは保存されません。
            </p>
            <div className="form-row">
              <button type="button" className="btn-primary" onClick={startSend}>
                この端末からデータを送信する
              </button>
              <button type="button" onClick={startReceive}>
                別の端末からデータを受信する
              </button>
            </div>
          </div>
        )}

        {mode === 'send' && (
          <div className="form-stack">
            {step === 'done' ? (
              <div>
                <p><strong>送信完了</strong>: データの転送が完了しました。</p>
                <button type="button" className="btn-primary" onClick={onClose}>
                  閉じる
                </button>
              </div>
            ) : step === 'error' ? (
              <div>
                <p>{errorMessage}</p>
                <button type="button" onClick={startSend}>
                  再試行
                </button>
              </div>
            ) : (
              <div>
                <p className="text-muted">
                  受信側の端末で以下の6桁コードを入力してください:
                </p>
                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {syncCode ? `${syncCode.slice(0, 3)} - ${syncCode.slice(3, 6)}` : '発行中...'}
                </p>
                <p className="text-muted">
                  {step === 'transferring' ? 'データ転送中...' : '相手デバイスからの接続待機中...'}
                </p>
                <button type="button" onClick={() => setMode('select')}>
                  戻る
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'receive' && (
          <div className="form-stack">
            {step === 'done' ? (
              <div>
                <p><strong>同期完了</strong>: データが反映されました。</p>
                <button type="button" className="btn-primary" onClick={onClose}>
                  閉じる
                </button>
              </div>
            ) : (
              <div className="form-stack">
                <div className="form-group">
                  <label>送信側に表示されている6桁の認証コード</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                    disabled={step === 'connecting' || step === 'transferring'}
                  />
                </div>
                {errorMessage && <p>{errorMessage}</p>}
                <div className="flex-row">
                  <button type="button" onClick={() => setMode('select')}>
                    戻る
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={executeReceive}
                    disabled={inputCode.length !== 6 || step === 'connecting' || step === 'transferring'}
                  >
                    {step === 'connecting'
                      ? '検索中...'
                      : step === 'transferring'
                      ? '受信中...'
                      : 'データを受信して同期'}
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
