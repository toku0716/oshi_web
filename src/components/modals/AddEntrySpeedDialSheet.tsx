import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useDialog } from '../../hooks/useDialog';
import {
  eventRepository,
  todoRepository,
  goodsRepository,
  expenseRepository,
} from '../../repository';
import {
  EXPENSE_CATEGORY_META,
  GOODS_CATEGORY_META,
  GOODS_OPEN_STATUS_META,
  type ExpenseCategory,
  type ExpenseItem,
  type Goods,
  type GoodsCategory,
  type GoodsOpenStatus,
  type OshiEvent,
  type Todo,
} from '../../types';
import {
  formatIsoDate,
  getTodayMidnight,
  resizeAndConvertImageToBase64,
} from '../../utils/oshiUtils';
import { SmartTimeKeypadSheet } from './SmartTimeKeypadSheet';

interface AddEntrySpeedDialSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: number; // 0: 予定, 1: TODO, 2: グッズ, 3: 支出
  allowedTypes?: number[];
  initialDate?: string; // YYYY-MM-DD
  initialIsWish?: boolean;
  editingEvent?: OshiEvent | null;
  editingTodo?: Todo | null;
  editingGoods?: Goods | null;
  editingExpense?: ExpenseItem | null;
}

const TYPE_META: Record<
  number,
  { label: string; modalTitle: string; editTitle: string; deleteLabel: string }
> = {
  0: {
    label: '予定',
    modalTitle: '予定を追加',
    editTitle: '予定を編集',
    deleteLabel: 'この予定を削除する',
  },
  1: {
    label: 'やること',
    modalTitle: 'やることを追加',
    editTitle: 'やることを編集',
    deleteLabel: 'このやることを削除する',
  },
  2: {
    label: 'グッズ',
    modalTitle: 'グッズを追加',
    editTitle: 'グッズを編集',
    deleteLabel: 'このグッズを削除する',
  },
  3: {
    label: '支出',
    modalTitle: '支出を記録',
    editTitle: '支出を編集',
    deleteLabel: 'この支出記録を削除する',
  },
};

export const AddEntrySpeedDialSheet: React.FC<AddEntrySpeedDialSheetProps> = ({
  isOpen,
  onClose,
  initialType = 0,
  allowedTypes = [0],
  initialDate,
  initialIsWish = false,
  editingEvent = null,
  editingTodo = null,
  editingGoods = null,
  editingExpense = null,
}) => {
  const { themeColor, isDark, refreshAllData, showToast } = useApp();

  const [type, setType] = useState<number>(initialType);
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [priceDisplay, setPriceDisplay] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    initialDate || formatIsoDate(getTodayMidnight())
  );
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [goodsStatus, setGoodsStatus] = useState<'owned' | 'preorder' | 'wish'>(() =>
    initialIsWish ? 'wish' : 'owned'
  );
  const [goodsCategory, setGoodsCategory] = useState<GoodsCategory>('other');
  const [goodsStorageLocation, setGoodsStorageLocation] = useState<string>('');
  const [goodsOpenStatus, setGoodsOpenStatus] = useState<GoodsOpenStatus>('unopened');
  const [goodsQuantity, setGoodsQuantity] = useState<number>(1);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('goods');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [isTimeKeypadOpen, setIsTimeKeypadOpen] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isEditing =
    !!editingEvent || !!editingTodo || !!editingGoods || !!editingExpense;

  const dialogRef = useDialog<HTMLFormElement>(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      if (editingEvent) {
        setType(0);
        setTitle(editingEvent.title || '');
        setLocation(editingEvent.location || '');
        setSelectedDate(
          editingEvent.date || formatIsoDate(getTodayMidnight())
        );
        setSelectedTime(editingEvent.time || '');
        setImageDataUrl(editingEvent.image || '');
        setIsTimeKeypadOpen(false);
        return;
      }
      if (editingTodo) {
        setType(1);
        setTitle(editingTodo.title || '');
        setSelectedDate(
          editingTodo.dueDate || formatIsoDate(getTodayMidnight())
        );
        setIsTimeKeypadOpen(false);
        return;
      }
      if (editingGoods) {
        setType(2);
        setTitle(editingGoods.name || '');
        setPriceDisplay(
          editingGoods.price > 0
            ? editingGoods.price.toLocaleString('ja-JP')
            : ''
        );
        const status = editingGoods.isWish
          ? 'wish'
          : editingGoods.isPreorder
          ? 'preorder'
          : 'owned';
        setGoodsStatus(status);
        setGoodsCategory(editingGoods.category || 'other');
        setGoodsStorageLocation(editingGoods.storageLocation || '');
        setGoodsOpenStatus(editingGoods.openStatus || 'unopened');
        setGoodsQuantity(editingGoods.quantity || 1);
        setSelectedDate(
          editingGoods.purchaseDate || formatIsoDate(getTodayMidnight())
        );
        setImageDataUrl(editingGoods.image || '');
        setIsTimeKeypadOpen(false);
        return;
      }
      if (editingExpense) {
        setType(3);
        setTitle(editingExpense.title || '');
        setPriceDisplay(
          editingExpense.amount > 0
            ? editingExpense.amount.toLocaleString('ja-JP')
            : ''
        );
        setSelectedDate(
          editingExpense.date || formatIsoDate(getTodayMidnight())
        );
        setExpenseCategory(editingExpense.category || 'goods');
        setImageDataUrl(editingExpense.image || '');
        setIsTimeKeypadOpen(false);
        return;
      }

      const validType = allowedTypes.includes(initialType)
        ? initialType
        : allowedTypes[0] ?? 0;
      setType(validType);
      setTitle('');
      setLocation('');
      setPriceDisplay('');
      setSelectedDate(initialDate || formatIsoDate(getTodayMidnight()));
      setSelectedTime('');
      setGoodsStatus(initialIsWish ? 'wish' : 'owned');
      setGoodsCategory('other');
      setGoodsStorageLocation('');
      setGoodsOpenStatus('unopened');
      setGoodsQuantity(1);
      setExpenseCategory('goods');
      setImageDataUrl('');
      setIsTimeKeypadOpen(false);
    }
  }, [
    isOpen,
    initialType,
    allowedTypes,
    initialDate,
    initialIsWish,
    editingEvent,
    editingTodo,
    editingGoods,
    editingExpense,
  ]);

  if (!isOpen) return null;

  const handlePriceChange = (raw: string) => {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    if (!digitsOnly) {
      setPriceDisplay('');
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (isNaN(num)) {
      setPriceDisplay('');
      return;
    }
    setPriceDisplay(num.toLocaleString('ja-JP'));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeAndConvertImageToBase64(file, 900, 0.85);
      setImageDataUrl(base64);
    } catch {
      showToast('画像の読み込みに失敗しました', 'error');
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleDeleteCurrentItem = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (editingEvent) {
      await eventRepository.delete(editingEvent.id);
      showToast('予定を削除しました', 'info');
    } else if (editingTodo) {
      await todoRepository.delete(editingTodo.id);
      showToast('やることを削除しました', 'info');
    } else if (editingGoods) {
      await goodsRepository.delete(editingGoods.id);
      showToast('グッズを削除しました', 'info');
    } else if (editingExpense) {
      await expenseRepository.delete(editingExpense.id);
      showToast('支出記録を削除しました', 'info');
    }
    await refreshAllData();
    onClose();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const now = new Date().toISOString();

    if (editingEvent) {
      await eventRepository.save({
        ...editingEvent,
        title: trimmedTitle,
        date: selectedDate,
        time: selectedTime || undefined,
        location: location.trim() || undefined,
        image: imageDataUrl || undefined,
        updatedAt: now,
      });
      await refreshAllData();
      showToast('予定を更新しました', 'success');
      onClose();
      return;
    }

    if (editingTodo) {
      await todoRepository.save({
        ...editingTodo,
        title: trimmedTitle,
        dueDate: selectedDate,
        updatedAt: now,
      });
      await refreshAllData();
      showToast('やることを更新しました', 'success');
      onClose();
      return;
    }

    if (editingGoods) {
      const price = parseInt(priceDisplay.replace(/,/g, ''), 10) || 0;
      await goodsRepository.save({
        ...editingGoods,
        name: trimmedTitle,
        category: goodsCategory,
        price,
        quantity: Math.max(1, goodsQuantity),
        isWish: goodsStatus === 'wish',
        isPreorder: goodsStatus === 'preorder',
        openStatus: goodsOpenStatus,
        storageLocation: goodsStorageLocation.trim() || undefined,
        image: imageDataUrl || undefined,
        purchaseDate: selectedDate,
        updatedAt: now,
      });
      await refreshAllData();
      showToast('グッズ情報を更新しました', 'success');
      onClose();
      return;
    }

    if (editingExpense) {
      const amount = parseInt(priceDisplay.replace(/,/g, ''), 10) || 0;
      await expenseRepository.save({
        ...editingExpense,
        title: trimmedTitle,
        amount,
        date: selectedDate,
        category: expenseCategory,
        image: imageDataUrl || undefined,
        updatedAt: now,
      });
      await refreshAllData();
      showToast('支出記録を更新しました', 'success');
      onClose();
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (type === 0) {
      await eventRepository.save({
        id,
        title: trimmedTitle,
        date: selectedDate,
        time: selectedTime || undefined,
        location: location.trim() || undefined,
        image: imageDataUrl || undefined,
        category: 'event',
        createdAt: now,
        updatedAt: now,
      });
    } else if (type === 1) {
      await todoRepository.save({
        id,
        title: trimmedTitle,
        dueDate: selectedDate,
        completed: false,
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
      });
    } else if (type === 2) {
      const price = parseInt(priceDisplay.replace(/,/g, ''), 10) || 0;
      await goodsRepository.save({
        id,
        name: trimmedTitle,
        category: goodsCategory,
        price,
        quantity: Math.max(1, goodsQuantity),
        isWish: goodsStatus === 'wish',
        isPreorder: goodsStatus === 'preorder',
        image: imageDataUrl || undefined,
        openStatus: goodsOpenStatus,
        storageLocation: goodsStorageLocation.trim() || undefined,
        purchaseDate: selectedDate,
        isFavorite: (editingGoods as Goods | null)?.isFavorite ?? false,
        memo: (editingGoods as Goods | null)?.memo,
        createdAt: now,
        updatedAt: now,
      });
    } else if (type === 3) {
      const amount = parseInt(priceDisplay.replace(/,/g, ''), 10) || 0;
      await expenseRepository.save({
        id,
        title: trimmedTitle,
        amount,
        date: selectedDate,
        category: expenseCategory,
        image: imageDataUrl || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    await refreshAllData();
    onClose();
  };

  const sheetBg = 'var(--bg-surface-elevated)';
  const inputBg = 'var(--bg-surface-subtle)';
  const textColor = 'var(--text-primary)';

  const placeholderText =
    type === 0
      ? '予定のタイトル (ライブ、配信など)'
      : type === 1
        ? 'やるべきこと (チケット発券など)'
        : type === 2
          ? 'グッズ名 (アクスタ、ペンライトなど)'
          : '支出内容 (ライブチケット代、遠征費など)';

  const displayDateSlash = selectedDate.replace(/-/g, '/');

  const headerTitle = isEditing
    ? TYPE_META[type]?.editTitle || '項目を編集'
    : TYPE_META[type]?.modalTitle || '項目を追加';

  if (!isOpen) return null;

  return (
    <>
      <div className="flutter-sheet-backdrop" onClick={onClose}>
        <form
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-entry-sheet-title"
          onSubmit={handleSubmit}
          className="flutter-bottom-sheet"
          style={{
            backgroundColor: sheetBg,
            padding: '16px 20px calc(24px + var(--safe-bottom))',
            maxHeight: '90dvh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flutter-sheet-handle" />

          {/* モーダルヘッダー */}
          <div
            style={{
              marginTop: 8,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              id="add-entry-sheet-title"
              style={{ fontSize: 18, fontWeight: 900, color: textColor, margin: 0 }}
            >
              {headerTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="閉じる"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 編集時でなく、許可された項目が複数ある場合のみタイプ切替タブを表示 */}
          {!isEditing && allowedTypes.length > 1 && (
            <div
              role="tablist"
              aria-label="登録種別の切り替え"
              style={{
                marginBottom: 14,
                padding: 4,
                backgroundColor: inputBg,
                borderRadius: 14,
                display: 'flex',
              }}
            >
              {allowedTypes.map((idx) => {
                const selected = type === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setType(idx)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 11,
                      border: 'none',
                      backgroundColor: selected ? themeColor : 'transparent',
                      color: selected
                        ? '#FFFFFF'
                        : 'var(--text-secondary)',
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {TYPE_META[idx]?.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* タイトル入力 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholderText}
            autoFocus
            style={{
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

          {/* 予定 or TODO or 支出: 日付・時間 */}
          {(type === 0 || type === 1 || type === 3) && (
            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (dateInputRef.current) {
                      if (typeof dateInputRef.current.showPicker === 'function') {
                        dateInputRef.current.showPicker();
                      } else {
                        dateInputRef.current.focus();
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{displayDateSlash}</span>
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {type === 0 && (
                <button
                  type="button"
                  onClick={() => setIsTimeKeypadOpen(true)}
                  style={{
                    flex: 1,
                    padding: '13px 14px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: inputBg,
                    color: selectedTime ? textColor : '#8E8E93',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{selectedTime || '時間 (任意)'}</span>
                </button>
              )}
            </div>
          )}

          {/* 予定: 場所入力 */}
          {type === 0 && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: inputBg,
                borderRadius: 14,
                padding: '0 14px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="場所・会場・URL (任意)"
                style={{
                  width: '100%',
                  padding: '14px 10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: textColor,
                  fontSize: 14,
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* グッズ: 状態・カテゴリ・金額・数量・保管場所 */}
          {type === 2 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 1. 所持状態セレクター (3択: 持ってる / 予約・注文中 / 欲しい) */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  ステータス
                </label>
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: inputBg,
                    padding: 3,
                    borderRadius: 12,
                    gap: 4,
                  }}
                >
                  {[
                    { key: 'owned', label: '持ってる' },
                    { key: 'preorder', label: '予約・注文中' },
                    { key: 'wish', label: '欲しいもの' },
                  ].map((s) => {
                    const sel = goodsStatus === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          setGoodsStatus(s.key as any);
                        }}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: 9,
                          border: 'none',
                          backgroundColor: sel ? themeColor : 'transparent',
                          color: sel ? '#FFFFFF' : textColor,
                          fontWeight: sel ? 800 : 600,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. カテゴリ選択 */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  カテゴリ
                </label>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {(Object.keys(GOODS_CATEGORY_META) as GoodsCategory[]).map((cat) => {
                    const sel = goodsCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setGoodsCategory(cat)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: sel ? 800 : 600,
                          backgroundColor: sel ? `${themeColor}26` : inputBg,
                          color: sel ? themeColor : 'var(--text-secondary)',
                          border: `1px solid ${sel ? themeColor : 'transparent'}`,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                      >
                        {GOODS_CATEGORY_META[cat].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. 価格 & 数量 */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div
                  style={{
                    flex: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: inputBg,
                    borderRadius: 14,
                    padding: '0 14px',
                  }}
                >
                  <span style={{ fontWeight: 900, fontSize: 16, color: '#8E8E93' }}>¥</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceDisplay}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="購入価格 (円)"
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: textColor,
                      fontSize: 14,
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: inputBg,
                    borderRadius: 14,
                    padding: '0 10px',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>数量</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setGoodsQuantity((q) => Math.max(1, q - 1))}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: textColor,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center', color: textColor }}>
                      {goodsQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGoodsQuantity((q) => q + 1)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: textColor,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. 保管場所（持ってる場合） */}
              {goodsStatus === 'owned' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: inputBg,
                      borderRadius: 14,
                      padding: '0 12px',
                    }}
                  >
                    <input
                      type="text"
                      value={goodsStorageLocation}
                      onChange={(e) => setGoodsStorageLocation(e.target.value)}
                      placeholder="保管場所 (例: アクリルケース、本棚、自室クローゼット)"
                      style={{
                        width: '100%',
                        padding: '12px 6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: textColor,
                        fontSize: 13,
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                  {/* クイック場所タグ */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {['自室デスク', 'アクリルケース', '収納ボックス', '本棚', 'バッグ'].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setGoodsStorageLocation(loc)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-surface-subtle)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. 開封・ディスプレイ状態（持ってる場合） */}
              {goodsStatus === 'owned' && (
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    保存状態
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(Object.keys(GOODS_OPEN_STATUS_META) as GoodsOpenStatus[]).map((st) => {
                      const sel = goodsOpenStatus === st;
                      const meta = GOODS_OPEN_STATUS_META[st];
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setGoodsOpenStatus(st)}
                          style={{
                            padding: '5px 11px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: sel ? 700 : 500,
                            backgroundColor: sel ? `${meta.color}22` : inputBg,
                            color: sel ? meta.color : 'var(--text-secondary)',
                            border: `1.2px solid ${sel ? meta.color : 'transparent'}`,
                            cursor: 'pointer',
                          }}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 支出: 金額 & カテゴリ選択 */}
          {type === 3 && (
            <>
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: inputBg,
                  borderRadius: 14,
                  padding: '0 14px',
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 16, color: '#8E8E93' }}>¥</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceDisplay}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="金額 (円)"
                  style={{
                    width: '100%',
                    padding: '14px 8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: textColor,
                    fontSize: 15,
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {(Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[]).map((cat) => {
                  const meta = EXPENSE_CATEGORY_META[cat];
                  const selected = expenseCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExpenseCategory(cat)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${selected ? meta.color : 'transparent'}`,
                        backgroundColor: selected ? `${meta.color}26` : inputBg,
                        color: selected ? meta.color : textColor,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* 画像追加（予定・グッズ・支出でIndexedDBに保存可能） */}
          {(type === 0 || type === 2 || type === 3) && (
            <div style={{ marginTop: 10 }}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              {imageDataUrl ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    backgroundColor: inputBg,
                    borderRadius: 14,
                  }}
                >
                  <img
                    src={imageDataUrl}
                    alt="プレビュー"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: textColor,
                      }}
                    >
                      画像を選択済み
                    </div>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      style={{
                        marginTop: 2,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: themeColor,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      別の画像に変更
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageDataUrl('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8E8E93',
                      padding: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label="画像を削除"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: `1.5px dashed ${isDark ? '#3A3D4D' : '#D5D8E0'}`,
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 13.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <span>写真・画像を追加 (任意)</span>
                </button>
              )}
            </div>
          )}

          {/* 保存・追加ボタン */}
          <button
            type="submit"
            style={{
              marginTop: 18,
              width: '100%',
              height: 52,
              borderRadius: 16,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            {isEditing ? '変更を保存する' : '追加する'}
          </button>

          {/* 編集モード時は削除ボタンも表示（誤タップ防止の2段階確認付き） */}
          {isEditing && (
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleDeleteCurrentItem}
                style={{
                  background: confirmDelete ? 'rgba(255,59,48,0.14)' : 'none',
                  border: confirmDelete ? '1.2px solid #FF3B30' : 'none',
                  borderRadius: 12,
                  color: '#FF3B30',
                  fontWeight: 800,
                  fontSize: 13.5,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                {confirmDelete
                  ? 'もう一度タップして完全に削除'
                  : TYPE_META[type]?.deleteLabel || '削除する'}
              </button>
            </div>
          )}
        </form>
      </div>

      <SmartTimeKeypadSheet
        isOpen={isTimeKeypadOpen}
        initialTime={selectedTime}
        onClose={() => setIsTimeKeypadOpen(false)}
        onConfirm={(val) => setSelectedTime(val)}
      />
    </>
  );
};
