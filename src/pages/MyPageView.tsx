import React, { useState, useRef, useMemo } from 'react';
import {
  Pencil,
  Heart,
  ExternalLink,
  MessageSquare,
  Search,
  Wallet,
  Smartphone,
  Calendar,
  Package,
  BookOpen,
  DollarSign,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TermsPrivacyModal } from '../components/modals/TermsPrivacyModal';
import { ResetDataModal } from '../components/modals/ResetDataModal';
import { backupRepository, oshiRepository, settingsRepository } from '../repository';
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
    events,
    goods,
    expenses,
    journals,
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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [budgetInput, setBudgetInput] = useState<string>(
    settings?.monthlyBudget ? String(settings.monthlyBudget) : ''
  );
  const [isSavingBudget, setIsSavingBudget] = useState<boolean>(false);

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

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedOshis = oshis.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.ruby?.toLowerCase().includes(q) ||
        o.group?.toLowerCase().includes(q) ||
        o.category?.toLowerCase().includes(q) ||
        o.memo?.toLowerCase().includes(q)
    );

    const matchedEvents = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.memo?.toLowerCase().includes(q) ||
        e.seatInfo?.toLowerCase().includes(q)
    );

    const matchedGoods = goods.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.memo?.toLowerCase().includes(q) ||
        g.storageLocation?.toLowerCase().includes(q)
    );

    const matchedExpenses = expenses.filter(
      (ex) =>
        ex.title.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.memo?.toLowerCase().includes(q)
    );

    const matchedJournals = journals.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.content.toLowerCase().includes(q) ||
        j.tags?.some((t) => t.toLowerCase().includes(q))
    );

    const totalCount =
      matchedOshis.length +
      matchedEvents.length +
      matchedGoods.length +
      matchedExpenses.length +
      matchedJournals.length;

    return {
      totalCount,
      oshis: matchedOshis,
      events: matchedEvents,
      goods: matchedGoods,
      expenses: matchedExpenses,
      journals: matchedJournals,
    };
  }, [searchQuery, oshis, events, goods, expenses, journals]);

  const handleSaveBudget = async (amount: number | undefined) => {
    setIsSavingBudget(true);
    try {
      await settingsRepository.saveSettings({ monthlyBudget: amount });
      await refreshAllData();
      setBudgetInput(amount ? String(amount) : '');
      showToast(
        amount ? `月間予算を ¥${amount.toLocaleString()} に設定しました` : '月間予算設定を解除しました',
        'success'
      );
    } catch {
      showToast('予算設定の保存に失敗しました', 'error');
    } finally {
      setIsSavingBudget(false);
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

      <div style={{ height: 16 }} />

      {/* 1. 横断グローバル検索バー */}
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <Search size={18} color={subtextColor} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="推し、イベント、グッズ、収支、レポを横断検索..."
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            fontWeight: 600,
            color: textColor,
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              background: 'none',
              border: 'none',
              color: subtextColor,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 検索結果パネル（検索ワード入力時のみ表示） */}
      {searchResults && (
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>
              検索結果: {searchResults.totalCount}件
            </span>
            <span style={{ fontSize: 11, color: subtextColor }}>
              キーワード「{searchQuery}」
            </span>
          </div>

          {searchResults.totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: subtextColor, fontSize: 13 }}>
              一致するデータが見つかりませんでした
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 推し結果 */}
              {searchResults.oshis.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: themeColor, marginBottom: 6 }}>
                    推し ({searchResults.oshis.length}件)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {searchResults.oshis.map((o) => (
                      <span
                        key={o.id}
                        onClick={() => openOshiSheet(o)}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 8,
                          backgroundColor: `${o.color || themeColor}18`,
                          color: o.color || themeColor,
                          cursor: 'pointer',
                        }}
                      >
                        {o.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 予定結果 */}
              {searchResults.events.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: themeColor, marginBottom: 6 }}>
                    予定・イベント ({searchResults.events.length}件)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {searchResults.events.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          backgroundColor: 'var(--bg-surface-subtle)',
                          fontSize: 12.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: textColor }}>{ev.title}</span>
                        <span style={{ color: subtextColor, fontSize: 11 }}>{ev.date.replace(/-/g, '/')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* グッズ結果 */}
              {searchResults.goods.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: themeColor, marginBottom: 6 }}>
                    グッズ ({searchResults.goods.length}件)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {searchResults.goods.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          backgroundColor: 'var(--bg-surface-subtle)',
                          fontSize: 12.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: textColor }}>{g.name}</span>
                        <span style={{ color: subtextColor, fontSize: 11 }}>
                          {g.category} {g.storageLocation ? `・${g.storageLocation}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 収支結果 */}
              {searchResults.expenses.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: themeColor, marginBottom: 6 }}>
                    収支 ({searchResults.expenses.length}件)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {searchResults.expenses.map((ex) => (
                      <div
                        key={ex.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          backgroundColor: 'var(--bg-surface-subtle)',
                          fontSize: 12.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: textColor }}>{ex.title}</span>
                        <span style={{ fontWeight: 800, color: textColor }}>¥{ex.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* レポ結果 */}
              {searchResults.journals.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: themeColor, marginBottom: 6 }}>
                    参戦レポ・思い出 ({searchResults.journals.length}件)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {searchResults.journals.map((j) => (
                      <div
                        key={j.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          backgroundColor: 'var(--bg-surface-subtle)',
                          fontSize: 12.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: textColor }}>{j.title}</span>
                        <span style={{ color: subtextColor, fontSize: 11 }}>{j.date.replace(/-/g, '/')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                  marginBottom: 16,
                  backgroundColor: cardBg,
                  borderRadius: 20,
                  border: `1px solid var(--border-subtle)`,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* プロフィールメイン（正方形写真 + 推し名/ルビ + カテゴリ/グループ + 編集 + 推し歴） */}
                <div style={{ padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* 正方形写真 (1:1) */}
                    <div
                      onClick={() => openOshiSheet(oshi)}
                      title="タップして画像・プロフィールを編集"
                      style={{
                        width: 76,
                        height: 76,
                        aspectRatio: '1 / 1',
                        borderRadius: 18,
                        backgroundColor: `${oColor}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        cursor: 'pointer',
                        border: `1px solid var(--border-subtle)`,
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
                            objectPosition: oshi.imagePosition || 'center 20%',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 28, fontWeight: 800, color: oColor }}>
                          {oshi.name.slice(0, 1)}
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* 上段：カテゴリ & 所属グループ & 編集ボタン */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: oColor,
                              flexShrink: 0,
                            }}
                          />
                          {oshi.category && (
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                backgroundColor: `${oColor}18`,
                                color: oColor,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {oshi.category}
                            </span>
                          )}
                          {oshi.group && (
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 999,
                                backgroundColor: 'var(--bg-surface-subtle)',
                                color: subtextColor,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {oshi.group}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => openOshiSheet(oshi)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: oColor,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 6px',
                            borderRadius: 8,
                            flexShrink: 0,
                          }}
                        >
                          <span>編集</span>
                          <Pencil size={11} strokeWidth={2.4} />
                        </button>
                      </div>

                      {/* 推しの名前（ここ1箇所のみに堂々と表示） */}
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 850,
                          letterSpacing: '-0.02em',
                          color: textColor,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {oshi.name}
                        {oshi.ruby && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: subtextColor, marginLeft: 6 }}>
                            （{oshi.ruby}）
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: `${oColor}18`,
                            color: oColor,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Heart size={11} fill="currentColor" />
                          <span>
                            {daysSince !== null
                              ? `推して ${daysSince} 日目`
                              : '応援中'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 記念日・ステータス Bento タイル */}
                  {(bdayDate || debutDateObj || oshi.sinceDate) && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: 8,
                        marginTop: 2,
                      }}
                    >
                      {oshi.sinceDate && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 12,
                            backgroundColor: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 700, color: subtextColor }}>推し始めた日</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: textColor }}>
                            {oshi.sinceDate.replace(/-/g, '/')}
                          </span>
                        </div>
                      )}

                      {bdayDate && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 12,
                            backgroundColor: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: subtextColor }}>誕生日</span>
                            {bDays === 0 ? (
                              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, backgroundColor: '#FF2D55', color: '#fff' }}>
                                TODAY
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#FF2D55' }}>あと{bDays}日</span>
                            )}
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: textColor }}>
                            {bdayDate.getMonth() + 1}/{bdayDate.getDate()}
                          </span>
                        </div>
                      )}

                      {debutDateObj && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 12,
                            backgroundColor: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: subtextColor }}>デビュー・記念日</span>
                            {dDays === 0 ? (
                              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, backgroundColor: '#FF9500', color: '#fff' }}>
                                {dYears}周年
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#FF9500' }}>あと{dDays}日</span>
                            )}
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: textColor }}>
                            {debutDateObj.getFullYear()}/{debutDateObj.getMonth() + 1}/{debutDateObj.getDate()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* メモ */}
                  {oshi.memo && oshi.memo.trim() && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        backgroundColor: 'var(--bg-surface-subtle)',
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: subtextColor,
                      }}
                    >
                      {oshi.memo}
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

        {/* 右カラム：予算・推しカラー・外観・PWA・データ管理 */}
        <div>
          {/* 1. 推し活の月間予算設定 */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: subtextColor,
              marginBottom: 8,
            }}
          >
            推し活の月間予算
          </div>
          <div
            style={{
              padding: 16,
              backgroundColor: cardBg,
              borderRadius: 16,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={18} color={themeColor} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: textColor }}>今月の予算目安</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 900, color: themeColor }}>
                {settings?.monthlyBudget ? `¥${settings.monthlyBudget.toLocaleString()}` : '未設定'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {[10000, 30000, 50000, 100000].map((amt) => {
                const isSelected = settings?.monthlyBudget === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSaveBudget(amt)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? themeColor : borderColor}`,
                      backgroundColor: isSelected ? `${themeColor}18` : 'transparent',
                      color: isSelected ? themeColor : textColor,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ¥{(amt / 10000).toFixed(0)}万
                  </button>
                );
              })}
              {settings?.monthlyBudget && (
                <button
                  type="button"
                  onClick={() => handleSaveBudget(undefined)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    backgroundColor: 'transparent',
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  解除
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="金額を入力 (例: 35000)"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                  backgroundColor: inputBg,
                  color: textColor,
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                disabled={isSavingBudget}
                onClick={() => {
                  const val = parseInt(budgetInput, 10);
                  if (!isNaN(val) && val > 0) {
                    handleSaveBudget(val);
                  }
                }}
                style={{
                  padding: '0 16px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: themeColor,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                保存
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: subtextColor, lineHeight: 1.4 }}>
              ※ 設定すると、ホーム画面と収支画面で今月の推し活予算との比較が反映されます。
            </div>
          </div>

          <div style={{ height: 20 }} />

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
            style={{
              padding: 3,
              backgroundColor: isDark ? '#1C1F2B' : '#F3F4F6',
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
                  onClick={() => setThemeMode(opt.mode)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: selected ? cardBg : 'transparent',
                    color: selected ? textColor : '#8E8E93',
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

          {/* 4. PWA・ホーム画面追加 */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#8E8E93',
              marginBottom: 8,
            }}
          >
            PWA・アプリ化について
          </div>
          <div
            style={{
              padding: 16,
              backgroundColor: cardBg,
              borderRadius: 16,
              border: `1px solid ${borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Smartphone size={20} color={themeColor} />
              <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>
                ホーム画面に追加してアプリとして使う
              </div>
            </div>
            <div style={{ fontSize: 12, color: subtextColor, lineHeight: 1.5 }}>
              本アプリはProgressive Web App (PWA) に対応しています。ホーム画面に追加すると、全画面のアプリ体験とオフラインでのデータ閲覧が利用可能になります。
            </div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: 'var(--bg-surface-subtle)',
                fontSize: 11.5,
                color: textColor,
                lineHeight: 1.6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div><strong>iOS (Safari):</strong> 下部の「共有」ボタン [↑] ➔ 「ホーム画面に追加」</div>
              <div><strong>Android / PC (Chrome):</strong> 右上のメニュー [⋮] ➔ 「アプリをインストール」</div>
            </div>
          </div>

          <div style={{ height: 20 }} />

          {/* 5. データ管理（バックアップ保存・復元） */}
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

          {/* 5. アプリ改善アンケート */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#8E8E93',
              marginBottom: 8,
            }}
          >
            フィードバック
          </div>
          <div
            style={{
              padding: '18px 20px',
              backgroundColor: cardBg,
              borderRadius: 16,
              border: `1px solid ${borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: textColor,
                    letterSpacing: '-0.01em',
                  }}
                >
                  アプリ改善アンケートにご協力ください
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#8E8E93',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  推しサポをより便利にするため、皆さまの感想や欲しい機能をお聞かせください。（所要時間: 約2〜3分）
                </div>
              </div>
            </div>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScDDuFzycUKURbf2saIABpcYtGiMKxP9mnQkEdoRRZqPd0foA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 18px',
                borderRadius: 12,
                backgroundColor: themeColor,
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              <span>アンケートに回答する（Googleフォーム）</span>
              <ExternalLink size={15} />
            </a>
          </div>

          <div style={{ height: 20 }} />

          {/* 6. データとプライバシー */}
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

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScDDuFzycUKURbf2saIABpcYtGiMKxP9mnQkEdoRRZqPd0foA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                padding: '12px 16px',
                textDecoration: 'none',
                color: textColor,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>ご意見・アンケートフォーム</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 4,
                    backgroundColor: `${themeColor}22`,
                    color: themeColor,
                  }}
                >
                  受付中
                </span>
              </span>
              <span style={{ color: '#8E8E93', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={13} />
              </span>
            </a>

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
            onSubmit={handleSaveOshi}
            className="flutter-bottom-sheet"
            style={{ backgroundColor: sheetBg, padding: '14px 20px 24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flutter-sheet-handle" />
            <div
              style={{
                marginTop: 14,
                fontSize: 18,
                fontWeight: 900,
                color: textColor,
              }}
            >
              {editingOshi === null ? '推しを登録' : '推し情報を編集'}
            </div>

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

                {/* 正方形プレビュー */}
                <div
                  style={{
                    position: 'relative',
                    width: 90,
                    height: 90,
                    margin: '0 auto',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: `1px solid ${subtextColor}33`,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
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
