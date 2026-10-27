import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  eventRepository,
  todoRepository,
  goodsRepository,
  expenseRepository,
} from '../../repository';
import {
  EXPENSE_CATEGORY_META,
  type ExpenseCategory,
  type ExpenseItem,
  type Goods,
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
  const [isWish, setIsWish] = useState<boolean>(initialIsWish);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('goods');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [isTimeKeypadOpen, setIsTimeKeypadOpen] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isEditing =
    !!editingEvent || !!editingTodo || !!editingGoods || !!editingExpense;

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
        setIsWish(!!editingGoods.isWish);
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
      setIsWish(initialIsWish);
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
        price,
        isWish,
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
        category: 'other',
        price,
        quantity: 1,
        isWish,
        image: imageDataUrl || undefined,
        openStatus: 'unopened',
        purchaseDate: selectedDate,
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

  const bgColor = isDark ? '#1C1D26' : '#FFFFFF';
  const inputBg = isDark ? '#242636' : '#F3F4F7';
  const textColor = isDark ? '#FFFFFF' : '#11141C';

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

  return (
    <>
      <div className="flutter-sheet-backdrop" onClick={onClose}>
        <form
          onSubmit={handleSubmit}
          className="flutter-bottom-sheet"
          style={{ backgroundColor: bgColor, padding: '16px 20px 24px' }}
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
            <span style={{ fontSize: 18, fontWeight: 900, color: textColor }}>
              {headerTitle}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#8E8E93',
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
                    onClick={() => setType(idx)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 11,
                      border: 'none',
                      backgroundColor: selected ? themeColor : 'transparent',
                      color: selected
                        ? '#FFFFFF'
                        : isDark
                          ? 'rgba(255,255,255,0.6)'
                          : 'rgba(0,0,0,0.6)',
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

          {/* グッズ: 価格 & 持ってる/欲しい */}
          {type === 2 && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  flex: 1,
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
                  placeholder="金額 (円・任意)"
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
              <button
                type="button"
                onClick={() => setIsWish(false)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `1.5px solid ${!isWish ? themeColor : 'transparent'}`,
                  backgroundColor: !isWish ? `${themeColor}26` : inputBg,
                  color: !isWish ? themeColor : textColor,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                持ってる
              </button>
              <button
                type="button"
                onClick={() => setIsWish(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `1.5px solid ${isWish ? themeColor : 'transparent'}`,
                  backgroundColor: isWish ? `${themeColor}26` : inputBg,
                  color: isWish ? themeColor : textColor,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                欲しい
              </button>
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
