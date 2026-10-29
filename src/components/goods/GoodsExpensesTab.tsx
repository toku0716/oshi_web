import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  EXPENSE_CATEGORY_META,
  type ExpenseCategory,
  type ExpenseItem,
} from '../../types';

interface GoodsExpensesTabProps {
  expenses: ExpenseItem[];
  themeColor: string;
  onOpenAddExpense: () => void;
  onOpenEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expense: ExpenseItem) => void;
}

export const GoodsExpensesTab: React.FC<GoodsExpensesTabProps> = ({
  expenses,
  themeColor,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 日付の降順（新しい順）にソート
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [expenses]);

  // 今月の支出
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const thisMonthTotal = useMemo(() => {
    return expenses
      .filter((e) => (e.date || '').startsWith(currentMonthKey))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, currentMonthKey]);

  const allTimeTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // カテゴリ絞り込み
  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') return sortedExpenses;
    return sortedExpenses.filter((e) => e.category === selectedCategory);
  }, [sortedExpenses, selectedCategory]);

  // 支出が0件の時はクリーンな案内のみ表示
  if (expenses.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 20,
          border: '1px solid var(--border-subtle)',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: `${themeColor}18`,
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColor,
          }}
        >
          <CreditCard size={28} />
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 800,
            margin: '0 0 6px',
            color: 'var(--text-primary)',
          }}
        >
          支出記録がまだありません
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}
        >
          ライブチケット代や遠征費、グッズ購入などの推し活出費を記録してみましょう
        </p>
        <button
          type="button"
          onClick={onOpenAddExpense}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 24px',
            borderRadius: 14,
            border: 'none',
            backgroundColor: themeColor,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${themeColor}44`,
          }}
        >
          <Plus size={16} />
          <span>支出を記録する</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* サマリーカード */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* 今月の支出 */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 18,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: 4,
            }}
          >
            今月の推し活支出
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: themeColor,
              letterSpacing: '-0.02em',
            }}
          >
            ¥{thisMonthTotal.toLocaleString('ja-JP')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {currentMonthKey.replace('-', '年')}月
          </div>
        </div>

        {/* 累計支出 */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 18,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: 4,
            }}
          >
            累計支出（全{expenses.length}件）
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            ¥{allTimeTotal.toLocaleString('ja-JP')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            登録された全期間の合計
          </div>
        </div>
      </div>

      {/* カテゴリ別フィルターピル */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 14,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: selectedCategory === 'all' ? `1.5px solid ${themeColor}` : '1px solid var(--border-subtle)',
            backgroundColor: selectedCategory === 'all' ? `${themeColor}15` : 'var(--bg-surface)',
            color: selectedCategory === 'all' ? themeColor : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          すべて ({expenses.length})
        </button>

        {(Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[]).map((cat) => {
          const meta = EXPENSE_CATEGORY_META[cat];
          const count = expenses.filter((e) => e.category === cat).length;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 13px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                border: isSelected ? `1.5px solid ${meta.color}` : '1px solid var(--border-subtle)',
                backgroundColor: isSelected ? `${meta.color}15` : 'var(--bg-surface)',
                color: isSelected ? meta.color : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: meta.color,
                }}
              />
              <span>{meta.label}</span>
              <span style={{ fontSize: 10.5, opacity: 0.8 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* 支出一覧 */}
      {filteredExpenses.length === 0 ? (
        <div
          style={{
            padding: '36px 16px',
            borderRadius: 20,
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1.5px dashed var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Receipt size={26} strokeWidth={2.2} />
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            {selectedCategory === 'all'
              ? '支出の記録がまだありません'
              : `${EXPENSE_CATEGORY_META[selectedCategory as ExpenseCategory]?.label || ''}の記録がありません`}
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '0 0 18px',
              lineHeight: 1.6,
            }}
          >
            チケット代、遠征交通費、グッズ購入などの支出を記録して、
            <br />
            推し活の出費を一元管理できます。
          </p>
          <button
            type="button"
            onClick={onOpenAddExpense}
            style={{
              padding: '10px 24px',
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
              boxShadow: `0 4px 14px ${themeColor}40`,
            }}
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>＋ 支出を記録</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredExpenses.map((exp) => {
            const meta = EXPENSE_CATEGORY_META[exp.category] || {
              label: 'その他',
              color: '#8E8E93',
            };

            return (
              <div
                key={exp.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 18,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                {/* 左側: カテゴリバッジ・タイトル・日付 */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: meta.color,
                        backgroundColor: `${meta.color}18`,
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {meta.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Calendar size={11} />
                      <span>{exp.date}</span>
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {exp.title}
                  </div>

                  {exp.memo && (
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
                      <FileText size={11} style={{ opacity: 0.7 }} />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {exp.memo}
                      </span>
                    </div>
                  )}
                </div>

                {/* 右側: 金額 & 操作ボタン */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ¥{(Number(exp.amount) || 0).toLocaleString('ja-JP')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => onOpenEditExpense(exp)}
                      aria-label={`${exp.title}を編集`}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp)}
                      aria-label={`${exp.title}を削除`}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 59, 48, 0.25)',
                        backgroundColor: 'rgba(255, 59, 48, 0.08)',
                        color: '#FF3B30',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* リスト末尾の追加ボタン（1つのみ） */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '12px',
              borderRadius: 16,
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
            <span>＋ 支出を記録する</span>
          </button>
        </div>
      )}
    </div>
  );
};
