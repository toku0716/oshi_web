import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  BookOpen,
  Plus,
  Calendar,
  Tag,
  Heart,
  TrendingUp,
  Trash2,
  Edit2,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { expenseRepository, journalRepository, settingsRepository } from '../repository';
import type { ExpenseItem, JournalEntry, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORY_META } from '../types';
import { formatIsoDate, getTodayMidnight } from '../utils/oshiUtils';

interface RecordsViewProps {
  onOpenAddExpense: () => void;
  onOpenEditExpense: (expense: ExpenseItem) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  onOpenAddExpense,
  onOpenEditExpense,
}) => {
  const {
    expenses,
    journals,
    oshis,
    activeOshiId,
    activeOshi,
    themeColor,
    isDark,
    settings,
    refreshAllData,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'expenses' | 'journal'>('expenses');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // 編集・追加モーダル用（日記）
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [journalTitle, setJournalTitle] = useState<string>('');
  const [journalDate, setJournalDate] = useState<string>(() => formatIsoDate(getTodayMidnight()));
  const [journalOshiId, setJournalOshiId] = useState<string>('');
  const [journalContent, setJournalContent] = useState<string>('');
  const [journalRating, setJournalRating] = useState<number>(5);

  const openJournalModal = (entry?: JournalEntry) => {
    if (entry) {
      setEditingJournal(entry);
      setJournalTitle(entry.title);
      setJournalDate(entry.date);
      setJournalOshiId(entry.oshiId || '');
      setJournalContent(entry.content);
      setJournalRating(entry.rating || 5);
    } else {
      setEditingJournal(null);
      setJournalTitle('');
      setJournalDate(formatIsoDate(getTodayMidnight()));
      setJournalOshiId(activeOshiId !== 'all' ? activeOshiId : (oshis[0]?.id || ''));
      setJournalContent('');
      setJournalRating(5);
    }
    setIsJournalModalOpen(true);
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim()) {
      showToast('タイトルを入力してください', 'error');
      return;
    }

    try {
      const entry: JournalEntry = {
        id: editingJournal ? editingJournal.id : `journal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: journalTitle.trim(),
        date: journalDate,
        oshiId: journalOshiId || undefined,
        content: journalContent.trim(),
        rating: journalRating,
        createdAt: editingJournal ? editingJournal.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await journalRepository.save(entry);
      await refreshAllData();
      setIsJournalModalOpen(false);
      showToast(editingJournal ? '記録を更新しました' : '思い出・レポを記録しました', 'success');
    } catch {
      showToast('保存に失敗しました', 'error');
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!window.confirm('この思い出・レポを削除しますか？')) return;
    try {
      await journalRepository.delete(id);
      await refreshAllData();
      showToast('削除しました', 'info');
    } catch {
      showToast('削除に失敗しました', 'error');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('この支出記録を削除しますか？')) return;
    try {
      await expenseRepository.delete(id);
      await refreshAllData();
      showToast('支出を削除しました', 'info');
    } catch {
      showToast('削除に失敗しました', 'error');
    }
  };

  // 予算設定
  const monthlyBudget = settings?.monthlyBudget || 30000;

  // 支出フィルタ（推し & 月）
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (activeOshiId !== 'all' && e.oshiId && e.oshiId !== activeOshiId) {
          return false;
        }
        return e.date.startsWith(selectedMonth);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, activeOshiId, selectedMonth]);

  const totalMonthExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  // 今年の累計支出
  const currentYear = selectedMonth.slice(0, 4);
  const totalYearExpense = useMemo(() => {
    return expenses
      .filter((e) => {
        if (activeOshiId !== 'all' && e.oshiId && e.oshiId !== activeOshiId) {
          return false;
        }
        return e.date.startsWith(currentYear);
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses, activeOshiId, currentYear]);

  // カテゴリ別支出合計
  const categoryTotals = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
      ticket: 0,
      goods: 0,
      travel: 0,
      fc: 0,
      cafe: 0,
      other: 0,
    };
    filteredExpenses.forEach((e) => {
      if (map[e.category] !== undefined) {
        map[e.category] += e.amount || 0;
      }
    });
    return map;
  }, [filteredExpenses]);

  // 日記フィルタ
  const filteredJournals = useMemo(() => {
    return journals
      .filter((j) => {
        if (activeOshiId !== 'all' && j.oshiId && j.oshiId !== activeOshiId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [journals, activeOshiId]);

  return (
    <div className="page-padding">
      {/* 画面ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            記録・収支
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            推し活の支出管理と思い出・参戦レポのプライベートアーカイブ
          </p>
        </div>

        <button
          type="button"
          onClick={() => (activeTab === 'expenses' ? onOpenAddExpense() : openJournalModal())}
          className="btn-primary"
          style={{ height: 36, padding: '0 14px', fontSize: 13 }}
        >
          <Plus size={16} />
          <span>{activeTab === 'expenses' ? '支出を記録' : '思い出を書く'}</span>
        </button>
      </div>

      {/* サブタブ切替 */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-subtle)',
          padding: 4,
          borderRadius: 10,
          marginBottom: 16,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: activeTab === 'expenses' ? 700 : 500,
            backgroundColor: activeTab === 'expenses' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'expenses' ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background-color 0.15s ease',
          }}
        >
          <CreditCard size={15} />
          <span>推し活支出 ({filteredExpenses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: activeTab === 'journal' ? 700 : 500,
            backgroundColor: activeTab === 'journal' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'journal' ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background-color 0.15s ease',
          }}
        >
          <BookOpen size={15} />
          <span>参戦レポ・思い出 ({filteredJournals.length})</span>
        </button>
      </div>

      {/* TAB 1: 推し活支出 */}
      {activeTab === 'expenses' && (
        <div>
          {/* 月選択バー */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {currentYear}年 累計: <strong style={{ color: 'var(--text-primary)' }}>¥{totalYearExpense.toLocaleString()}</strong>
            </span>
          </div>

          {/* 今月の支出サマリーカード & 予算進捗 */}
          <div className="clean-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {selectedMonth.replace('-', '年')}月の推し活支出
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                予算目標: ¥{monthlyBudget.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                ¥{totalMonthExpense.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: totalMonthExpense > monthlyBudget ? '#EF4444' : 'var(--text-secondary)' }}>
                ({Math.round((totalMonthExpense / (monthlyBudget || 1)) * 100)}%)
              </span>
            </div>

            {/* 予算ゲージバー */}
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                backgroundColor: 'var(--bg-surface-subtle)',
                overflow: 'hidden',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((totalMonthExpense / (monthlyBudget || 1)) * 100))}%`,
                  backgroundColor: totalMonthExpense > monthlyBudget ? '#EF4444' : themeColor,
                  borderRadius: 3,
                }}
              />
            </div>

            {/* カテゴリ別内訳 */}
            {totalMonthExpense > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                  const val = categoryTotals[cat];
                  if (val === 0) return null;
                  const meta = EXPENSE_CATEGORY_META[cat];
                  return (
                    <div
                      key={cat}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-surface-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{meta.label}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>¥{val.toLocaleString()}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 支出明細リスト */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
              支出明細 ({filteredExpenses.length}件)
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="clean-card" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                この月の推し活支出は記録されていません
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredExpenses.map((item) => {
                  const meta = EXPENSE_CATEGORY_META[item.category] || EXPENSE_CATEGORY_META.other;
                  const itemOshi = oshis.find((o) => o.id === item.oshiId);
                  return (
                    <div
                      key={item.id}
                      className="clean-card"
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            backgroundColor: `${meta.color}18`,
                            color: meta.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ShoppingBag size={18} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: meta.color }}>
                              {meta.label}
                            </span>
                            {itemOshi && (
                              <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', padding: '1px 5px', borderRadius: 4, backgroundColor: 'var(--bg-surface-subtle)' }}>
                                {itemOshi.name}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {item.date.replace(/-/g, '/')}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </div>
                          {item.memo && (
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {item.memo}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                          ¥{item.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenEditExpense(item)}
                          style={{ padding: 4, color: 'var(--text-secondary)' }}
                          aria-label="編集"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(item.id)}
                          style={{ padding: 4, color: '#EF4444' }}
                          aria-label="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 参戦レポ・思い出日記 */}
      {activeTab === 'journal' && (
        <div>
          {filteredJournals.length === 0 ? (
            <div className="clean-card" style={{ padding: '40px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <BookOpen size={36} color="var(--text-secondary)" />
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                推し活の思い出を記録しましょう
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.5 }}>
                ライブや現場の参戦レポ、セトリの感想、日々の推しへの想いなどをプライベートに保存できます。
              </div>
              <button
                type="button"
                onClick={() => openJournalModal()}
                className="btn-primary"
                style={{ height: 38, padding: '0 16px', fontSize: 13, marginTop: 4 }}
              >
                <Plus size={16} />
                <span>初めての思い出を書く</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredJournals.map((entry) => {
                const jOshi = oshis.find((o) => o.id === entry.oshiId);
                return (
                  <div key={entry.id} className="clean-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {entry.date.replace(/-/g, '/')}
                        </span>
                        {jOshi && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6,
                              backgroundColor: `${jOshi.color}18`,
                              color: jOshi.color,
                            }}
                          >
                            {jOshi.name}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {entry.rating && (
                          <div style={{ display: 'flex', gap: 2, marginRight: 6 }}>
                            {Array.from({ length: entry.rating }).map((_, i) => (
                              <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openJournalModal(entry)}
                          style={{ padding: 4, color: 'var(--text-secondary)' }}
                          aria-label="編集"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteJournal(entry.id)}
                          style={{ padding: 4, color: '#EF4444' }}
                          aria-label="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                      {entry.title}
                    </h3>

                    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {entry.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 思い出・レポ モーダル */}
      {isJournalModalOpen && (
        <div className="modal-overlay" onClick={() => setIsJournalModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingJournal ? '思い出・レポを編集' : '思い出・参戦レポを記録'}
              </h3>
              <button
                type="button"
                onClick={() => setIsJournalModalOpen(false)}
                style={{ color: 'var(--text-secondary)', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJournal} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  タイトル
                </label>
                <input
                  type="text"
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder="例: ツアー初日参戦！神席でした"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    日付
                  </label>
                  <input
                    type="date"
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    関連する推し
                  </label>
                  <select
                    value={journalOshiId}
                    onChange={(e) => setJournalOshiId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">指定なし</option>
                    {oshis.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  満足度・評価
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setJournalRating(num)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        backgroundColor: journalRating >= num ? '#F59E0B' : 'var(--bg-surface-subtle)',
                        color: journalRating >= num ? '#FFFFFF' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ★ {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  レポ・感想・セトリメモ
                </label>
                <textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="現場の感想や推しの尊かった瞬間、当日のタイムラインやセトリなどを自由にメモしてください。"
                  rows={6}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="btn-secondary"
                  style={{ height: 40 }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ height: 40, backgroundColor: themeColor }}
                >
                  {editingJournal ? '更新する' : '保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
