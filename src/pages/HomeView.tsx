import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { todoRepository } from '../repository';
import type { OshiEvent, Todo } from '../types';
import { pressable } from '../utils/a11y';
import { ScheduleCard } from '../components/schedule/ScheduleCard';
import {
  getDaysUntilDate,
  getWeekdayJa,
  isTodayDate,
  parseLocalDate,
  sortEventsByTime,
} from '../utils/oshiUtils';

interface HomeViewProps {
  onOpenAddEvent: () => void;
  onOpenEditEvent: (event: OshiEvent) => void;
  onOpenAddTodo: () => void;
  onOpenEditTodo: (todo: Todo) => void;
  onNavigateToMyPage?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenAddEvent,
  onOpenEditEvent,
  onOpenAddTodo,
  onOpenEditTodo,
}) => {
  const {
    activeOshiId,
    oshis,
    events,
    todos,
    refreshAllData,
    showToast,
    themeColor,
    isDark,
    recoverableBackup,
    restoreRecoverableBackup,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [showCompletedTodos, setShowCompletedTodos] = useState(false);

  // 1秒毎に現在時刻を更新（リアルタイムにカウントダウンを動かす）
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeOshi = useMemo(() => {
    if (activeOshiId && activeOshiId !== 'all') {
      const found = oshis.find((o) => o.id === activeOshiId);
      if (found) return found;
    }
    return oshis[0] || null;
  }, [oshis, activeOshiId]);

  const accentColor = themeColor || activeOshi?.color || '#FF2D55';

  // 今日の予定のみを抽出
  const todayEvents = useMemo(
    () => sortEventsByTime(events.filter((e) => isTodayDate(e.date))),
    [events]
  );

  // 未完了TODO（期日が近い順）
  const incompleteTodos = useMemo(
    () =>
      [...todos.filter((t) => !t.completed)].sort((a, b) =>
        (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')
      ),
    [todos]
  );

  // 完了済みTODO
  const completedTodos = useMemo(
    () =>
      [...todos.filter((t) => !!t.completed)].sort((a, b) =>
        (b.completedAt || b.updatedAt || '').localeCompare(
          a.completedAt || a.updatedAt || ''
        )
      ),
    [todos]
  );

  // TODO完了切り替え
  const handleToggleTodo = async (todo: Todo) => {
    const nextCompleted = !todo.completed;
    await todoRepository.save({
      ...todo,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
    await refreshAllData();
    if (nextCompleted) {
      showToast('完了にしました', 'success', {
        actionLabel: '元に戻す',
        onAction: async () => {
          await todoRepository.save({
            ...todo,
            completed: false,
            completedAt: undefined,
            updatedAt: new Date().toISOString(),
          });
          await refreshAllData();
        },
      });
    }
  };

  // 日付の表示用フォーマット
  const dateStr = useMemo(() => {
    const m = currentTime.getMonth() + 1;
    const d = currentTime.getDate();
    const w = getWeekdayJa(currentTime);
    return `${m}月${d}日 (${w})`;
  }, [currentTime]);

  const yearStr = useMemo(() => `${currentTime.getFullYear()}年`, [currentTime]);

  return (
    <div
      style={{
        maxWidth: 820,
        margin: '0 auto',
        padding: '20px 16px 100px',
        minHeight: '100vh',
      }}
    >
      {/* 復元可能なバックアップ通知 */}
      {recoverableBackup && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 18px',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 600 }}>
            バックアップデータが見つかりました
          </span>
          <button
            type="button"
            onClick={restoreRecoverableBackup}
            style={{
              padding: '6px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              backgroundColor: accentColor,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 9999,
              cursor: 'pointer',
            }}
          >
            復元
          </button>
        </div>
      )}

      {/* トップヘッダー：今日の日付と大画面タイトル */}
      <header style={{ marginBottom: 28, padding: '4px 4px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {yearStr}
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 6vw, 36px)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {dateStr}
        </h1>
      </header>

      {/* ========================================================
          1. 今日の予定（大画面表示）
         ======================================================== */}
      <section style={{ marginBottom: 36 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            padding: '0 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Calendar size={22} style={{ color: accentColor }} />
              今日の予定
            </h2>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: todayEvents.length > 0 ? accentColor : 'var(--text-muted)',
                backgroundColor:
                  todayEvents.length > 0 ? `${accentColor}18` : 'var(--bg-surface-subtle)',
                padding: '1px 8px',
                borderRadius: 9999,
              }}
            >
              {todayEvents.length > 0 ? `${todayEvents.length}件` : 'なし'}
            </span>
          </div>


        </div>

        {todayEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {todayEvents.map((ev) => (
              <ScheduleCard
                key={ev.id}
                event={ev}
                currentTime={currentTime}
                onClick={onOpenEditEvent}
              />
            ))}
            {/* 今日の予定リスト末尾の追加ボタン */}
            <button
              type="button"
              onClick={onOpenAddEvent}
              style={{
                marginTop: 4,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                border: '1.5px dashed var(--border-subtle)',
                borderRadius: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={15} />
              <span>今日の予定を追加</span>
            </button>
          </div>
        ) : (
          /* 今日の予定なし空カード（通常カード型） */
          <div
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 20,
              border: '1.5px dashed var(--border-subtle)',
              padding: '32px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Calendar size={26} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                本日の予定はありません
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                イベント・配信・記念日・発売日など、今日の予定を登録できます
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAddEvent}
              style={{
                marginTop: 4,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 800,
                backgroundColor: themeColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 9999,
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${themeColor}44`,
              }}
            >
              ＋ 今日の予定を追加
            </button>
          </div>
        )}
      </section>

      {/* ========================================================
          2. TODO・やること（大画面表示）
         ======================================================== */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 14,
            padding: '0 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={22} style={{ color: accentColor }} />
              TODO・やること
            </h2>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: incompleteTodos.length > 0 ? '#FF9F0A' : 'var(--text-muted)',
                backgroundColor:
                  incompleteTodos.length > 0
                    ? 'rgba(255, 159, 10, 0.16)'
                    : 'var(--bg-surface-subtle)',
                padding: '1px 8px',
                borderRadius: 9999,
              }}
            >
              {incompleteTodos.length > 0 ? `${incompleteTodos.length}件` : '完了'}
            </span>
          </div>
        </div>

        {/* 未完了TODOリスト */}
        {incompleteTodos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incompleteTodos.map((t) => {
              const dueDays = t.dueDate ? getDaysUntilDate(t.dueDate) : null;
              const dueParsed = parseLocalDate(t.dueDate);
              const isOverdue = dueDays !== null && dueDays < 0;
              const isToday = dueDays === 0;
              const isTomorrow = dueDays === 1;

              const dueBadge = dueParsed ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    backgroundColor: isOverdue
                      ? 'rgba(255, 69, 58, 0.16)'
                      : isToday
                        ? `${accentColor}20`
                        : isTomorrow
                          ? 'rgba(255, 159, 10, 0.16)'
                          : 'var(--bg-surface-subtle)',
                    color: isOverdue
                      ? '#FF453A'
                      : isToday
                        ? accentColor
                        : isTomorrow
                          ? '#FF9F0A'
                          : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isOverdue
                    ? '期限切れ'
                    : isToday
                      ? '今日まで'
                      : isTomorrow
                        ? '明日まで'
                        : `${dueParsed.getMonth() + 1}/${dueParsed.getDate()}`}
                </span>
              ) : null;

              const todoOshi = t.oshiId ? oshis.find((o) => o.id === t.oshiId) : null;

              return (
                <div
                  key={t.id}
                  {...pressable(() => onOpenEditTodo(t))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 16,
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1.5px solid var(--border-subtle)',
                    boxShadow: isDark
                      ? '0 2px 8px rgba(0, 0, 0, 0.25)'
                      : '0 2px 6px rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                  }}
                >
                  {/* チェックボックスボタン（押しやすい大きめタッチターゲット） */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTodo(t);
                    }}
                    aria-label={`「${t.title}」を完了`}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      border: `2px solid ${isToday || isOverdue ? '#FF453A' : 'var(--border-strong)'}`,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'all 0.15s ease',
                    }}
                  />

                  {/* タスク内容 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.title}
                    </div>

                    {todoOshi && (
                      <div
                        style={{
                          fontSize: 11,
                          color: todoOshi.color || 'var(--text-muted)',
                          marginTop: 2,
                          fontWeight: 600,
                        }}
                      >
                        {todoOshi.name}
                      </div>
                    )}
                  </div>

                  {/* 期日バッジ */}
                  {dueBadge}
                </div>
              );
            })}

            {/* リスト末尾の追加ボタン（1つのみ） */}
            <button
              type="button"
              onClick={onOpenAddTodo}
              style={{
                marginTop: 4,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                border: '1.5px dashed var(--border-subtle)',
                borderRadius: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={15} />
              <span>TODOを追加</span>
            </button>
          </div>
        ) : (
          /* 未完了TODOなし空カード */
          <div
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 20,
              border: '1.5px dashed var(--border-subtle)',
              padding: '32px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              TODOはありません
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ここからTODOを追加することができます
            </div>
            <button
              type="button"
              onClick={onOpenAddTodo}
              style={{
                marginTop: 4,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 800,
                backgroundColor: themeColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 9999,
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${themeColor}44`,
              }}
            >
              ＋ TODOを追加
            </button>
          </div>
        )}

        {/* 完了済みTODOアコーディオン */}
        {completedTodos.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setShowCompletedTodos((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 4px',
              }}
            >
              {showCompletedTodos ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              完了済み ({completedTodos.length}件)
            </button>

            {showCompletedTodos && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {completedTodos.map((t) => (
                  <div
                    key={t.id}
                    {...pressable(() => onOpenEditTodo(t))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 16px',
                      borderRadius: 14,
                      backgroundColor: 'var(--bg-surface-subtle)',
                      opacity: 0.65,
                      cursor: 'pointer',
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTodo(t);
                      }}
                      aria-label={`「${t.title}」を未完了に戻す`}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        border: 'none',
                        backgroundColor: '#34C759',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>

                    <div
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: 'var(--text-muted)',
                        textDecoration: 'line-through',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
