import React, { useState, useRef } from 'react';
import { Pencil, Heart, Gift, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useDialog } from '../hooks/useDialog';
import { TermsPrivacyModal } from '../components/modals/TermsPrivacyModal';
import { ResetDataModal } from '../components/modals/ResetDataModal';
import { backupRepository, oshiRepository } from '../repository';
import type { Oshi, ThemeModeOption } from '../types';
import {
  clearGoogleSession,
  getEffectiveAccessConfig,
  getSavedGoogleSession,
} from '../utils/googleAuthUtils';
import {
  formatIsoDate,
  getDaysUntilBirthday,
  getDaysUntilDebut,
  getDebutYears,
  getOshiDaysSince,
  getOshiSinceDateStr,
  getTodayMidnight,
  parseLocalDate,
  PRESET_OSHI_COLORS,
  resizeAndConvertImageToBase64,
} from '../utils/oshiUtils';

interface MyPageViewProps {
  onLogout?: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({ onLogout }) => {
  const {
    oshis,
    settings,
    themeColor,
    setThemeColor,
    themeMode,
    setThemeMode,
    isDark,
    refreshAllData,
    clearAllData,
    showToast,
  } = useApp();

  const [isOshiSheetOpen, setIsOshiSheetOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [editingOshi, setEditingOshi] = useState<Oshi | null>(null);
  const [oshiName, setOshiName] = useState<string>('');
  const [oshiColor, setOshiColor] = useState<string>(themeColor);
  const [oshiImage, setOshiImage] = useState<string>('');
  const [oshiImagePosition, setOshiImagePosition] = useState<number>(20);
  const [sinceDate, setSinceDate] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [debutDate, setDebutDate] = useState<string>('');
  const [confirmDeleteOshi, setConfirmDeleteOshi] = useState<boolean>(false);

  const oshiSheetRef = useDialog<HTMLFormElement>(isOshiSheetOpen, () =>
    setIsOshiSheetOpen(false)
  );

  const sinceInputRef = useRef<HTMLInputElement>(null);
  const birthdayInputRef = useRef<HTMLInputElement>(null);
  const debutInputRef = useRef<HTMLInputElement>(null);
  const oshiImageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openOshiSheet = (existing?: Oshi) => {
    setConfirmDeleteOshi(false);
    if (existing) {
      setEditingOshi(existing);
      setOshiName(existing.name);
      setOshiColor(existing.color || themeColor);
      setOshiImage(existing.image || '');
      const match = existing.imagePosition?.match(/(\d+)%/);
      setOshiImagePosition(match ? parseInt(match[1], 10) : 20);
      setSinceDate(getOshiSinceDateStr(existing) || '');
      setBirthday(existing.birthday || '');
      setDebutDate(existing.debutDate || '');
    } else {
      setEditingOshi(null);
      setOshiName('');
      setOshiColor(themeColor);
      setOshiImage('');
      setOshiImagePosition(20);
      setSinceDate(formatIsoDate(getTodayMidnight()));
      setBirthday('');
      setDebutDate('');
    }
    setIsOshiSheetOpen(true);
  };

  const handleOshiImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeAndConvertImageToBase64(file, 700, 0.85);
      setOshiImage(base64);
    } catch {
      showToast('画像の読み込みに失敗しました', 'error');
    } finally {
      if (oshiImageInputRef.current) oshiImageInputRef.current.value = '';
    }
  };

  const handleSaveOshi = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = oshiName.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    const item: Oshi = {
      id:
        editingOshi?.id ||
        `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmed,
      color: oshiColor || themeColor,
      sinceDate: sinceDate || undefined,
      birthday: birthday || undefined,
      debutDate: debutDate || undefined,
      image: oshiImage || undefined,
      imagePosition: oshiImage ? `center ${oshiImagePosition}%` : undefined,
      createdAt: editingOshi?.createdAt || now,
      updatedAt: now,
    };

    await oshiRepository.save(item);
    await refreshAllData();
    setIsOshiSheetOpen(false);
  };

  const handleDeleteOshi = async () => {
    if (!editingOshi) return;
    if (!confirmDeleteOshi) {
      setConfirmDeleteOshi(true);
      return;
    }
    await oshiRepository.delete(editingOshi.id);
    await refreshAllData();
    setIsOshiSheetOpen(false);
  };

  const handleExportBackup = async () => {
    try {
      await backupRepository.downloadBackupFile();
      showToast('バックアップを保存しました', 'success');
    } catch {
      showToast('バックアップの保存に失敗しました', 'error');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await backupRepository.importBackup(parsed);
      await refreshAllData();
      showToast('バックアップを復元しました', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '復元に失敗しました',
        'error'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cardBg = isDark ? '#171821' : '#FFFFFF';
  const borderColor = isDark ? '#262838' : '#E8EBF2';
  const textColor = isDark ? '#FFFFFF' : '#11141C';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const sheetBg = isDark ? '#1C1D26' : '#FFFFFF';
  const inputBg = isDark ? '#222432' : '#F4F5F8';

  const renderDatePickerTile = (
    label: string,
    valueStr: string,
    inputRef: React.RefObject<HTMLInputElement | null>,
    onChange: (val: string) => void,
    onClear: () => void,
    monthDayOnly = false
  ) => {
    const parsed = parseLocalDate(valueStr);
    const displayValue = parsed
      ? monthDayOnly
        ? `${parsed.getMonth() + 1}月${parsed.getDate()}日`
        : `${parsed.getFullYear()}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${String(parsed.getDate()).padStart(2, '0')}`
      : '未設定';

    return (
      <div
        style={{
          position: 'relative',
          padding: '12px 14px',
          backgroundColor: inputBg,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          onClick={() => {
            if (inputRef.current) {
              if (typeof inputRef.current.showPicker === 'function') {
                inputRef.current.showPicker();
              } else {
                inputRef.current.focus();
              }
            }
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: textColor }}>
            {label}: {displayValue}
          </span>
        </div>
        {valueStr && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'none',
              border: 'none',
              color: '#8E8E93',
              padding: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <input
          ref={inputRef}
          type="date"
          value={valueStr}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  };

  return (
    <div className="page-padding">
      <div style={{ fontSize: 24, fontWeight: 700, color: textColor, letterSpacing: '-0.02em' }}>
        マイページ
      </div>

      <div style={{ height: 20 }} />

      {/* スマホは1カラム、タブレット・PCは2カラム（左：推しプロフィール、右：設定・データ管理） */}
      <div className="mypage-grid-layout">
        {/* 左カラム：推しプロフィールカード一覧 & 追加ボタン */}
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: subtextColor,
              marginBottom: 12,
            }}
          >
            推しプロフィール
          </div>
          {oshis.map((oshi) => {
            const oColor = oshi.color || themeColor;
            const daysSince = getOshiDaysSince(oshi);
            const bdayDate = parseLocalDate(oshi.birthday);
            const bDays = getDaysUntilBirthday(oshi);
            const debutDateObj = parseLocalDate(oshi.debutDate);
            const dDays = getDaysUntilDebut(oshi);
            const dYears = getDebutYears(oshi);

            return (
              <div
                key={oshi.id}
                style={{
                  marginBottom: 18,
                  backgroundColor: cardBg,
                  borderRadius: 22,
                  border: `1px solid var(--border-subtle)`,
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* 会員証トップバー */}
                <div
                  style={{
                    padding: '12px 18px',
                    background: `linear-gradient(90deg, ${oColor}18, transparent)`,
                    borderBottom: `1px solid var(--border-subtle)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: oColor }}>
                      FAN MEMBERSHIP
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openOshiSheet(oshi)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: oColor,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <span>編集</span>
                    <Pencil size={11} strokeWidth={2.4} />
                  </button>
                </div>

                {/* 会員証メイン（写真 + 推し名 + 推し歴） */}
                <div style={{ padding: '20px 20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      onClick={() => openOshiSheet(oshi)}
                      title="タップして画像・プロフィールを編集"
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 20,
                        backgroundColor: `${oColor}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        cursor: 'pointer',
                        border: `2px solid ${oColor}`,
                        boxShadow: `0 4px 16px ${oColor}44`,
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
                        <svg width="34" height="34" viewBox="0 0 24 24" fill={oColor} stroke={oColor} strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          color: textColor,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {oshi.name}
                      </div>

                      <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: `${oColor}1F`,
                            color: oColor,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Heart size={11} fill="currentColor" />
                          <span>
                            {daysSince !== null
                              ? `推し始めて ${daysSince} 日目`
                              : 'ずっと応援中'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 記念日バッジ（誕生日・デビュー日） */}
                  {(bdayDate || debutDateObj) && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: `1px dashed ${borderColor}`,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      {bdayDate && (
                        <div
                          style={{
                            padding: '6px 12px',
                            backgroundColor: isDark ? 'rgba(255, 45, 85, 0.16)' : 'rgba(255, 45, 85, 0.1)',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 800,
                            color: '#FF2D55',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Gift size={13} strokeWidth={2.2} />
                          <span>
                            誕生日 {bdayDate.getMonth() + 1}/{bdayDate.getDate()}
                          </span>
                          <span style={{ opacity: 0.85, fontWeight: 700 }}>
                            {bDays === 0 ? '（本日）' : `（あと${bDays}日）`}
                          </span>
                        </div>
                      )}

                      {debutDateObj && (
                        <div
                          style={{
                            padding: '6px 12px',
                            backgroundColor: isDark ? 'rgba(255, 149, 0, 0.16)' : 'rgba(255, 149, 0, 0.1)',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 800,
                            color: '#FF9500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Sparkles size={13} strokeWidth={2.2} />
                          <span>
                            デビュー {debutDateObj.getFullYear()}/{debutDateObj.getMonth() + 1}/{debutDateObj.getDate()}
                          </span>
                          <span style={{ opacity: 0.85, fontWeight: 700 }}>
                            {dDays === 0
                              ? `（${dYears}周年 本日）`
                              : `（${dYears}周年まであと${dDays}日）`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 推し追加ボタン */}
          <button
            type="button"
            onClick={() => openOshiSheet()}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 16,
              border: `1.5px dashed ${borderColor}`,
              backgroundColor: cardBg,
              color: themeColor,
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 16 }}>＋</span>
            <span>新しい推しを登録する</span>
          </button>
        </div>

        {/* 右カラム：推しカラー設定・外観モード・データ管理 */}
        <div>
          {/* 2. 推しカラー（テーマカラー）設定 */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#8E8E93',
              marginBottom: 8,
            }}
          >
            推しカラー
          </div>
          <div
            style={{
              padding: 16,
              backgroundColor: cardBg,
              borderRadius: 16,
              border: `1px solid ${borderColor}`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {PRESET_OSHI_COLORS.map((preset) => {
              const isSelected =
                themeColor.toUpperCase() === preset.hex.toUpperCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setThemeColor(preset.hex)}
                  title={preset.name}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: preset.hex,
                    border: isSelected ? '2.5px solid #FFFFFF' : 'none',
                    boxShadow: isSelected
                      ? `0 2px 6px ${preset.hex}88`
                      : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ height: 20 }} />

          {/* 3. 外観モード（ライト / ダーク / システム） */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#8E8E93',
              marginBottom: 8,
            }}
          >
            外観
          </div>
          <div
            role="radiogroup"
            aria-label="外観モード"
            style={{
              padding: 3,
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 10,
              display: 'flex',
            }}
          >
            {(
              [
                { mode: 'system', label: 'システム' },
                { mode: 'light', label: 'ライト' },
                { mode: 'dark', label: 'ダーク' },
              ] as { mode: ThemeModeOption; label: string }[]
            ).map((opt) => {
              const selected = themeMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setThemeMode(opt.mode)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: selected ? cardBg : 'transparent',
                    color: selected ? textColor : 'var(--text-secondary)',
                    fontWeight: selected ? 700 : 500,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div style={{ height: 20 }} />

          {/* 4. データ管理（バックアップ保存・復元） */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#8E8E93',
              marginBottom: 8,
            }}
          >
            データ管理
          </div>
          <div
            style={{
              padding: 16,
              backgroundColor: cardBg,
              borderRadius: 16,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={handleExportBackup}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: 'transparent',
                  color: textColor,
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                バックアップ保存
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: 'transparent',
                  color: textColor,
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                バックアップ復元
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportBackup}
                style={{ display: 'none' }}
              />
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 11.5,
                lineHeight: 1.5,
                color: '#8E8E93',
              }}
            >
              ※ 全データを1つのJSONファイルとして端末外に保存・復元できます。
            </div>

            <div
              style={{
                margin: '14px 0 12px',
                height: 1,
                backgroundColor: borderColor,
              }}
            />

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 10,
                border: 'none',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                color: '#EF4444',
                fontWeight: 600,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>全データを初期化</span>
            </button>
          </div>

          <div style={{ height: 20 }} />

          {/* 5. データとプライバシー */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#8E8E93',
              marginBottom: 8,
            }}
          >
            プライバシーと規約
          </div>
          <div
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              border: `1px solid ${borderColor}`,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 16px' }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: textColor,
                }}
              >
                対象者とデータの保存について
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#8E8E93',
                }}
              >
                本アプリはZEN大学の生徒のみを対象としています。登録したデータはすべてお使いの端末内にのみ保存され、外部サーバーへの自動送信や個人情報収集は行われません。今後のサービス向上のため、フィードバックへのご協力をお願いいたします。
              </div>
            </div>

            <div
              style={{
                height: 1,
                backgroundColor: borderColor,
              }}
            />

            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: textColor,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>利用規約・プライバシーポリシー</span>
              <span style={{ color: '#8E8E93', fontSize: 13 }}>›</span>
            </button>
          </div>

          {/* 6. アプリ改善アンケート */}
          <div style={{ height: 20 }} />
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#8E8E93',
              marginBottom: 8,
            }}
          >
            ご意見・ご要望
          </div>
          <div
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              border: `1px solid ${borderColor}`,
              padding: '16px',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 4 }}>
              📝 アプリ改善アンケート
            </div>
            <div style={{ fontSize: 12, color: '#8E8E93', lineHeight: 1.5, marginBottom: 12 }}>
              推しサポをより便利にするため、ご意見・ご感想をお聞かせください。（所要時間: 約2分）
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScDDuFzycUKURbf2saIABpcYtGiMKxP9mnQkEdoRRZqPd0foA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                padding: '10px 16px',
                borderRadius: 12,
                backgroundColor: themeColor,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              <span>アンケートに回答する</span>
              <span style={{ fontSize: 12 }}>↗</span>
            </a>
          </div>

          {/* Google認証でログイン中の場合のみアカウント表示＆ログアウトボタンを表示（管理者設定は一切表示しない） */}
          {(() => {
            const accessConfig = getEffectiveAccessConfig(settings);
            const session = getSavedGoogleSession();
            if (!accessConfig.enabled || !session) return null;
            return (
              <>
                <div style={{ height: 24 }} />
                <div
                  style={{
                    padding: '14px 18px',
                    backgroundColor: cardBg,
                    borderRadius: 18,
                    border: `1.2px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: 12.5, color: '#8E8E93', fontWeight: 700 }}>
                    認証中のGoogleアカウント:{' '}
                    <span style={{ color: textColor, fontWeight: 800 }}>
                      {session.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearGoogleSession();
                      showToast('ログアウトしました');
                      onLogout?.();
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      border: `1px solid ${borderColor}`,
                      backgroundColor: 'transparent',
                      color: textColor,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    ログアウト
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* データの取り扱い・プライバシーポリシー詳細モーダル */}
      <TermsPrivacyModal
        isOpen={isPrivacyOpen}
        mode="view"
        onClose={() => setIsPrivacyOpen(false)}
      />

      {/* 全データ初期化確認モーダル */}
      <ResetDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={clearAllData}
      />

      {/* 推し登録・編集モーダル */}
      {isOshiSheetOpen && (
        <div
          className="flutter-sheet-backdrop"
          onClick={() => setIsOshiSheetOpen(false)}
        >
          <form
            ref={oshiSheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="oshi-sheet-title"
            onSubmit={handleSaveOshi}
            className="flutter-bottom-sheet"
            style={{
              backgroundColor: sheetBg,
              padding: '14px 20px calc(24px + var(--safe-bottom))',
              maxHeight: '90dvh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flutter-sheet-handle" />
            <h2
              id="oshi-sheet-title"
              style={{
                marginTop: 14,
                fontSize: 18,
                fontWeight: 900,
                color: textColor,
                margin: '14px 0 0',
              }}
            >
              {editingOshi === null ? '推しを登録' : '推し情報を編集'}
            </h2>

            {/* 推しの画像選択（IndexedDBに保存） */}
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <input
                ref={oshiImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleOshiImageSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => oshiImageInputRef.current?.click()}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  border: `2px dashed ${themeColor}`,
                  backgroundColor: `${themeColor}1A`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {oshiImage ? (
                  <img
                    src={oshiImage}
                    alt="推し画像"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                )}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => oshiImageInputRef.current?.click()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {oshiImage ? 'アイコン画像を変更' : 'アイコン画像を選択'}
                </button>
                {oshiImage && (
                  <button
                    type="button"
                    onClick={() => setOshiImage('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#FF3B30',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    画像を削除
                  </button>
                )}
              </div>
            </div>

            {oshiImage && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: inputBg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: subtextColor }}>
                    カバー表示位置（顔のフォーカス）
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: themeColor }}>
                    {oshiImagePosition}%
                  </span>
                </div>

                {/* ミニカバープレビュー */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 70,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: `1px solid ${subtextColor}33`,
                  }}
                >
                  <img
                    src={oshiImage}
                    alt="プレビュー"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `center ${oshiImagePosition}%`,
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: subtextColor }}>上</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={oshiImagePosition}
                    onChange={(e) => setOshiImagePosition(Number(e.target.value))}
                    style={{ flex: 1, accentColor: themeColor, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 600, color: subtextColor }}>下</span>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { label: '顔優先 (15%)', val: 15 },
                    { label: '標準 (25%)', val: 25 },
                    { label: '中央 (50%)', val: 50 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setOshiImagePosition(p.val)}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: `1px solid ${oshiImagePosition === p.val ? themeColor : `${subtextColor}33`}`,
                        backgroundColor: oshiImagePosition === p.val ? `${themeColor}22` : 'transparent',
                        color: oshiImagePosition === p.val ? themeColor : subtextColor,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <input
              type="text"
              value={oshiName}
              onChange={(e) => setOshiName(e.target.value)}
              placeholder="推しの名前"
              autoFocus
              style={{
                marginTop: 14,
                width: '100%',
                padding: '14px 16px',
                borderRadius: 14,
                border: 'none',
                backgroundColor: inputBg,
                color: textColor,
                fontSize: 16,
                fontWeight: 700,
                outline: 'none',
              }}
            />

            <div style={{ marginTop: 10 }}>
              {renderDatePickerTile(
                '推し始めた日',
                sinceDate,
                sinceInputRef,
                (val) => setSinceDate(val),
                () => setSinceDate('')
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              {renderDatePickerTile(
                '誕生日',
                birthday,
                birthdayInputRef,
                (val) => setBirthday(val),
                () => setBirthday(''),
                true
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              {renderDatePickerTile(
                'デビュー日・結成日',
                debutDate,
                debutInputRef,
                (val) => setDebutDate(val),
                () => setDebutDate('')
              )}
            </div>

            {/* この推しのメンバーカラー選択 */}
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: '#8E8E93',
                  marginBottom: 8,
                }}
              >
                この推しのイメージカラー
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {PRESET_OSHI_COLORS.map((preset) => {
                  const selected =
                    oshiColor.toUpperCase() === preset.hex.toUpperCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setOshiColor(preset.hex)}
                      title={preset.name}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        backgroundColor: preset.hex,
                        border: selected ? '2.5px solid #FFFFFF' : 'none',
                        boxShadow: selected
                          ? `0 2px 8px ${preset.hex}99`
                          : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      {selected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: 18,
                width: '100%',
                height: 52,
                borderRadius: 16,
                border: 'none',
                backgroundColor: oshiColor || themeColor,
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {editingOshi === null ? '登録' : '保存'}
            </button>

            {editingOshi !== null && (
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleDeleteOshi}
                  style={{
                    background: confirmDeleteOshi
                      ? 'rgba(255,59,48,0.14)'
                      : 'none',
                    border: confirmDeleteOshi
                      ? '1.2px solid #FF3B30'
                      : 'none',
                    borderRadius: 12,
                    color: '#FF3B30',
                    fontWeight: 800,
                    fontSize: 13.5,
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  {confirmDeleteOshi
                    ? 'もう一度タップして登録を解除'
                    : '登録を解除'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
