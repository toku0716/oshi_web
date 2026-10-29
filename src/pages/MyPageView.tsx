import React, { useState, useRef } from 'react';
import {
  Heart,
  Palette,
  UserCheck,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Check,
  Camera,
  Sun,
  Moon,
  Laptop,
  X,
  Calendar,
  Database,
  Download,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { oshiRepository, backupRepository } from '../repository';
import type { Oshi, ThemeModeOption } from '../types';
import {
  clearAdminGoogleSession,
  clearGoogleSession,
  getSavedGoogleSession,
} from '../utils/googleAuthUtils';
import {
  PRESET_OSHI_COLORS,
  getOshiDaysSince,
  resizeAndConvertImageToBase64,
} from '../utils/oshiUtils';

interface MyPageViewProps {
  onLogout?: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({ onLogout }) => {
  const {
    oshis,
    activeOshiId,
    setActiveOshiId,
    themeColor,
    setThemeColor,
    themeMode,
    setThemeMode,
    refreshAllData,
    showToast,
  } = useApp();

  const [googleSession, setGoogleSession] = useState(getSavedGoogleSession);

  // 推し登録・編集モーダルステート
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOshi, setEditingOshi] = useState<Oshi | null>(null);
  const [oshiName, setOshiName] = useState('');
  const [oshiColor, setOshiColor] = useState('#FF2D55');
  const [sinceDate, setSinceDate] = useState('');
  const [oshiImage, setOshiImage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // バックアップJSONダウンロード（データ保存）
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const fileName = await backupRepository.downloadBackupFile();
      showToast(`バックアップを保存しました（${fileName}）`, 'success');
    } catch {
      showToast('バックアップの保存に失敗しました', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // バックアップJSONファイル読み込み（データ復元）
  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const oCount = parsed.data?.oshis?.length ?? (Array.isArray(parsed.oshis) ? parsed.oshis.length : 0);
        const eCount = parsed.data?.events?.length ?? (Array.isArray(parsed.events) ? parsed.events.length : 0);
        const tCount = parsed.data?.todos?.length ?? (Array.isArray(parsed.todos) ? parsed.todos.length : 0);
        const gCount = parsed.data?.goods?.length ?? (Array.isArray(parsed.goods) ? parsed.goods.length : 0);

        const confirmMsg =
          `バックアップファイルから以下のデータが見つかりました：\n` +
          `・推し: ${oCount}件\n` +
          `・予定: ${eCount}件\n` +
          `・TODO: ${tCount}件\n` +
          `・グッズ: ${gCount}件\n\n` +
          `現在の端末内データに上書き復元しますか？`;

        if (!window.confirm(confirmMsg)) {
          setIsImporting(false);
          return;
        }

        const result = await backupRepository.importBackup(parsed);
        await refreshAllData();
        showToast(
          `データを復元しました！（推し: ${result.oshisCount}件, 予定: ${result.eventsCount}件, グッズ: ${result.goodsCount}件）`,
          'success'
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'バックアップファイルの読み込みに失敗しました',
          'error'
        );
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      showToast('ファイルの読み込みに失敗しました', 'error');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  // ログアウト処理
  const handleLogoutGoogle = () => {
    clearGoogleSession();
    clearAdminGoogleSession();
    setGoogleSession(null);
    showToast('ログアウトしました');
    onLogout?.();
  };

  // 新規登録モーダルを開く
  const handleOpenAddModal = () => {
    setEditingOshi(null);
    setOshiName('');
    setOshiColor(themeColor || '#FF2D55');
    setSinceDate('');
    setOshiImage('');
    setConfirmDeleteId(null);
    setIsModalOpen(true);
  };

  // 編集モーダルを開く
  const handleOpenEditModal = (oshi: Oshi) => {
    setEditingOshi(oshi);
    setOshiName(oshi.name);
    setOshiColor(oshi.color || themeColor || '#FF2D55');
    setSinceDate(oshi.sinceDate || '');
    setOshiImage(oshi.image || '');
    setConfirmDeleteId(null);
    setIsModalOpen(true);
  };

  // 画像アップロード処理
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeAndConvertImageToBase64(file, 600, 0.85);
      setOshiImage(base64);
    } catch {
      showToast('画像の読み込みに失敗しました', 'error');
    }
  };

  // 推しの保存
  const handleSaveOshi = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = oshiName.trim();
    if (!trimmed) {
      showToast('推しの名前を入力してください', 'error');
      return;
    }

    const oshiToSave: Oshi = {
      id: editingOshi ? editingOshi.id : `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      color: oshiColor,
      sinceDate: sinceDate || undefined,
      image: oshiImage || undefined,
      createdAt: editingOshi?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await oshiRepository.save(oshiToSave);
      if (!activeOshiId || editingOshi === null) {
        await setActiveOshiId(oshiToSave.id);
      }
      await refreshAllData();
      setIsModalOpen(false);
      showToast(editingOshi ? '推し情報を更新しました' : '推しを登録しました！');
    } catch {
      showToast('保存に失敗しました', 'error');
    }
  };

  // 推しの削除
  const handleDeleteOshi = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    try {
      await oshiRepository.delete(id);
      await refreshAllData();
      setConfirmDeleteId(null);
      showToast('登録を解除しました');
    } catch {
      showToast('削除に失敗しました', 'error');
    }
  };

  return (
    <div
      style={{
        padding: '24px 16px 80px',
        maxWidth: 640,
        margin: '0 auto',
      }}
    >
      {/* ページタイトル */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          マイページ
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
          }}
        >
          推しの設定とアプリのカラー
        </p>
      </div>

      {/* ========================================================
          カード1: 推しの登録
          ======================================================== */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 22,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: `${themeColor}18`,
                color: themeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Heart size={18} fill="currentColor" strokeWidth={2} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                推しの登録
              </h2>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                推しメンバーの管理
              </span>
            </div>
          </div>
        </div>

        {/* 推し一覧 */}
        {oshis.length === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              borderRadius: 16,
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1.5px dashed var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              まだ推しが登録されていません
            </div>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                margin: '0 0 16px',
              }}
            >
              推しを登録すると、予定やグッズを推しごとに管理できます。
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                padding: '10px 22px',
                borderRadius: 9999,
                backgroundColor: themeColor,
                color: '#FFFFFF',
                border: 'none',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>推しを登録する</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {oshis.map((oshi) => {
              const daysSince = getOshiDaysSince(oshi);
              const isActive = oshi.id === activeOshiId;
              const oColor = oshi.color || themeColor;

              return (
                <div
                  key={oshi.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 16,
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {/* アイコン画像 */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: `${oColor}22`,
                        border: `2px solid ${oColor}`,
                        color: oColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {oshi.image ? (
                        <img
                          src={oshi.image}
                          alt={oshi.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 18, fontWeight: 900 }}>
                          {oshi.name.slice(0, 1)}
                        </span>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {oshi.name}
                        </span>
                      </div>

                      {daysSince !== null && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: 'var(--text-secondary)',
                            marginTop: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Calendar size={12} style={{ color: oColor }} />
                          <span>推し始めて <strong>{daysSince}</strong> 日目</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 操作ボタン */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(oshi)}
                      aria-label={`${oshi.name}を編集`}
                      style={{
                        padding: '6px 11px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Pencil size={12} />
                      <span>編集</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOshi(oshi.id)}
                      aria-label={`${oshi.name}を削除`}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        backgroundColor:
                          confirmDeleteId === oshi.id
                            ? '#FF3B30'
                            : 'rgba(255, 59, 48, 0.08)',
                        color: confirmDeleteId === oshi.id ? '#FFFFFF' : '#FF3B30',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Trash2 size={12} />
                      <span>{confirmDeleteId === oshi.id ? '削除確定' : '解除'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 新しい推しを追加するボタン（リスト末尾に1つのみ配置） */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                marginTop: 4,
                width: '100%',
                padding: '11px',
                borderRadius: 14,
                border: '1.5px dashed var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'background-color 0.15s ease',
              }}
            >
              <Plus size={15} strokeWidth={2.4} />
              <span>新しい推しを追加する</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          カード2: テーマカラー
          ======================================================== */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 22,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: `${themeColor}18`,
              color: themeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Palette size={18} strokeWidth={2.2} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              テーマカラー
            </h2>
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              アクセントカラーと外観モード
            </span>
          </div>
        </div>

        {/* 10色カラーパレット */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {PRESET_OSHI_COLORS.map((preset) => {
            const isSelected = themeColor.toUpperCase() === preset.hex.toUpperCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setThemeColor(preset.hex)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 4px',
                  borderRadius: 14,
                  border: isSelected
                    ? `2px solid ${preset.hex}`
                    : '1px solid transparent',
                  backgroundColor: isSelected
                    ? `${preset.hex}15`
                    : 'var(--bg-surface-subtle)',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: preset.hex,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: isSelected ? `0 4px 12px ${preset.hex}66` : 'none',
                  }}
                >
                  {isSelected && <Check size={16} strokeWidth={3} />}
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {preset.name.replace('ビビッド', '').replace('シルバー/', '')}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, backgroundColor: 'var(--border-subtle)', margin: '16px 0' }} />

        {/* 外観モード切り替え（システム / ライト / ダーク） */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            表示モード
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              padding: 4,
              borderRadius: 14,
              backgroundColor: 'var(--bg-surface-subtle)',
            }}
          >
            {(
              [
                { mode: 'system', label: 'システム', Icon: Laptop },
                { mode: 'light', label: 'ライト', Icon: Sun },
                { mode: 'dark', label: 'ダーク', Icon: Moon },
              ] as const
            ).map(({ mode, label, Icon }) => {
              const active = themeMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setThemeMode(mode as ThemeModeOption)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: active ? 800 : 600,
                    fontSize: 12.5,
                    boxShadow: active ? 'var(--shadow-card)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          カード3: データの保存と復元（バックアップ）
          ======================================================== */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 22,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: `${themeColor}18`,
              color: themeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Database size={18} strokeWidth={2.2} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              データの保存と復元
            </h2>
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              バックアップJSONの書き出し・読み込み
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 16px',
          }}
        >
          推し・予定・TODO・グッズなどの登録データは端末（ブラウザ）内に保存されています。バックアップをJSONファイルとして保存・復元できます。
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {/* バックアップ保存（ダウンロード）ボタン */}
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 14,
              border: `1.5px solid ${themeColor}44`,
              backgroundColor: `${themeColor}12`,
              color: themeColor,
              fontSize: 13,
              fontWeight: 800,
              cursor: isExporting ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={16} strokeWidth={2.4} />
            <span>{isExporting ? '保存中...' : 'データを保存 (JSON)'}</span>
          </button>

          {/* バックアップ復元（ファイル選択）ボタン */}
          <button
            type="button"
            onClick={() => backupFileInputRef.current?.click()}
            disabled={isImporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 14,
              border: '1.5px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 800,
              cursor: isImporting ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={16} strokeWidth={2.4} />
            <span>{isImporting ? '復元中...' : 'データを復元 (JSON)'}</span>
          </button>
        </div>

        {/* 非表示のファイル入力 */}
        <input
          ref={backupFileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportBackupFile}
          style={{ display: 'none' }}
        />
      </div>

      {/* ========================================================
          カード4: Googleアカウント ＆ ログアウト（最下部）
          ======================================================== */}
      {googleSession && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 20,
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <UserCheck size={18} color="#34C759" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Googleログイン中
              </div>
              <strong
                style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {googleSession.email}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogoutGoogle}
            style={{
              padding: '7px 15px',
              borderRadius: 9999,
              border: '1.2px solid rgba(255, 59, 48, 0.4)',
              backgroundColor: 'rgba(255, 59, 48, 0.08)',
              color: '#FF3B30',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <LogOut size={13} />
            <span>ログアウト</span>
          </button>
        </div>
      )}

      {/* ========================================================
          推し登録・編集モーダル
          ======================================================== */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <form
            onSubmit={handleSaveOshi}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 24,
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-modal)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                {editingOshi ? '推し情報を編集' : '新しい推しを登録'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 写真と名前 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* アイコン写真選択 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 18,
                  border: `2px dashed ${oshiColor}`,
                  backgroundColor: `${oshiColor}18`,
                  color: oshiColor,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {oshiImage ? (
                  <img
                    src={oshiImage}
                    alt="プレビュー"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <>
                    <Camera size={20} />
                    <span style={{ fontSize: 9.5, fontWeight: 700 }}>写真</span>
                  </>
                )}
              </button>

              {/* 推しの名前 */}
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  推しの名前 <span style={{ color: '#FF3B30' }}>*</span>
                </label>
                <input
                  type="text"
                  value={oshiName}
                  onChange={(e) => setOshiName(e.target.value)}
                  placeholder="推しの名前を入力"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* 推し始めた日 */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                推し始めた日（記念日）
              </label>
              <input
                type="date"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* メンバーカラー */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                メンバーカラー
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                {PRESET_OSHI_COLORS.map((preset) => {
                  const isSelected = oshiColor.toUpperCase() === preset.hex.toUpperCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setOshiColor(preset.hex)}
                      title={preset.name}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: preset.hex,
                        border: isSelected
                          ? '3px solid var(--text-primary)'
                          : '2px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.1s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* 保存 / キャンセル */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: themeColor,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: `0 4px 14px ${themeColor}44`,
                }}
              >
                保存する
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
