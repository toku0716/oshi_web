import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Heart,
  CheckSquare,
  Gift,
  Clock,
  Plus,
  Sliders,
  AlertCircle,
  CreditCard,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { oshiRepository, todoRepository } from '../repository';
import type { OshiEvent, Todo } from '../types';
import {
  formatIsoDate,
  getDaysUntilDate,
  getDebutYears,
  getEventCountdownInfo,
  getOshiDaysSince,
  getWeekdayJa,
  isBirthdayToday,
  isDebutAnniversaryToday,
  isTodayDate,
  parseLocalDate,
  sortEventsByDateAndTime,
  sortEventsByTime,
} from '../utils/oshiUtils';

interface HomeViewProps {
  onOpenAddEvent: () => void;
  onOpenEditEvent: (event: OshiEvent) => void;
  onOpenAddTodo: () => void;
  onOpenEditTodo: (todo: Todo) => void;
  onNavigateToTab?: (tabIndex: number) => void;
}

function parseImagePositionY(pos?: string): number {
  if (!pos) return 20;
  const match = pos.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : 20;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenAddEvent,
  onOpenEditEvent,
  onOpenAddTodo,
  onOpenEditTodo,
  onNavigateToTab,
}) => {
  const {
    oshis,
    events,
    todos,
    goods,
    expenses,
    settings,
    themeColor,
    isDark,
    refreshAllData,
    recoverableBackup,
    restoreRecoverableBackup,
    showToast,
  } = useApp();

  const [selectedOshiIndex, setSelectedOshiIndex] = useState<number>(0);
  const [showCompletedTodos, setShowCompletedTodos] = useState<boolean>(false);
  const [isAdjustingPosition, setIsAdjustingPosition] = useState<boolean>(false);
  const [adjustPositionY, setAdjustPositionY] = useState<number>(20);
  const [isSavingPosition, setIsSavingPosition] = useState<boolean>(false);

  const activeOshi = oshis[selectedOshiIndex] || oshis[0] || null;
  const oColor = activeOshi?.color || themeColor;

  useEffect(() => {
    setIsAdjustingPosition(false);
    setAdjustPositionY(parseImagePositionY(activeOshi?.imagePosition));
  }, [activeOshi?.id, activeOshi?.imagePosition]);

  const handleSavePosition = async () => {
    if (!activeOshi) return;
    setIsSavingPosition(true);
    try {
      const updated = {
        ...activeOshi,
        imagePosition: `center ${adjustPositionY}%`,
        updatedAt: new Date().toISOString(),
      };
      await oshiRepository.save(updated);
      await refreshAllData();
      setIsAdjustingPosition(false);
      showToast('画像の位置を保存しました', 'success');
    } catch {
      showToast('保存に失敗しました', 'error');
    } finally {
      setIsSavingPosition(false);
    }
  };

  const todayEvents = sortEventsByTime(
    events.filter((e) => isTodayDate(e.date))
  );
  const futureEvents = sortEventsByDateAndTime(
    events.filter((e) => getDaysUntilDate(e.date) > 0)
  );
  const incompleteTodos = [...todos.filter((t) => !t.completed)].sort((a, b) =>
    (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')
  );
  const completedTodos = [...todos.filter((t) => !!t.completed)].sort((a, b) =>
    (b.completedAt || b.updatedAt || '').localeCompare(
      a.completedAt || a.updatedAt || ''
    )
  );

  const hasToday = todayEvents.length > 0;
  const nextEvent: OshiEvent | null = hasToday
    ? todayEvents[0]
    : futureEvents.length > 0
      ? futureEvents[0]
      : null;

  const otherUpcomingEvents = nextEvent
    ? [
        ...todayEvents.filter((e) => e.id !== nextEvent.id),
        ...futureEvents.filter((e) => e.id !== nextEvent.id),
      ].slice(0, 4)
    : [];

  const handleToggleTodo = async (todo: Todo) => {
    const nextCompleted = !todo.completed;
    await todoRepository.save({
      ...todo,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
    await refreshAllData();
  };

  // 直近の重要締切（チケット申込・入金・予約締切）
  const upcomingDeadlines = useMemo(() => {
    const list: { id: string; title: string; date: string; type: 'ticket' | 'payment' | 'todo'; daysLeft: number }[] = [];
    events.forEach((ev) => {
      if (ev.ticketDeadline) {
        const d = getDaysUntilDate(ev.ticketDeadline);
        if (d >= 0 && d <= 14) {
          list.push({ id: `${ev.id}_td`, title: `${ev.title} (チケット申込締切)`, date: ev.ticketDeadline, type: 'ticket', daysLeft: d });
        }
      }
      if (ev.paymentDeadline) {
        const d = getDaysUntilDate(ev.paymentDeadline);
        if (d >= 0 && d <= 14) {
          list.push({ id: `${ev.id}_pd`, title: `${ev.title} (チケット入金締切)`, date: ev.paymentDeadline, type: 'payment', daysLeft: d });
        }
      }
    });
    todos.filter((t) => !t.completed && t.dueDate).forEach((td) => {
      const d = getDaysUntilDate(td.dueDate!);
      if (d >= 0 && d <= 7) {
        list.push({ id: td.id, title: td.title, date: td.dueDate!, type: 'todo', daysLeft: d });
      }
    });
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [events, todos]);

  // 今月の支出サマリー
  const currentMonthPrefix = formatIsoDate(new Date()).slice(0, 7);
  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const monthlyBudget = settings?.monthlyBudget || 30000;
  const budgetRatio = Math.min(100, Math.round((currentMonthTotal / (monthlyBudget || 1)) * 100));

  // 予約・注文中グッズ数
  const preorderedGoodsCount = goods.filter((g) => g.isPreorder).length;

  return (
    <div className="page-padding">
      {/* バックアップ復元通知 */}
      {recoverableBackup && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 12,
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
            以前のバックアップデータが見つかりました
          </span>
          <button
            type="button"
            onClick={restoreRecoverableBackup}
            className="btn-primary"
            style={{ height: 32, padding: '0 12px', fontSize: 12 }}
          >
            復元
          </button>
        </div>
      )}

      {/* 推し未登録時 */}
      {!activeOshi ? (
        <div
          className="clean-card"
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: `${themeColor}18`,
              color: themeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={26} fill="currentColor" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            推しを登録しましょう
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.5 }}>
            マイページから推しの名前や写真、記念日を設定すると、あなた専用の推し活スペースが始まります。
          </div>
        </div>
      ) : (
        <>
          {/* 複数推し切り替えバー */}
          {oshis.length > 1 && (
            <div className="oshi-switcher-bar">
              {oshis.map((o, idx) => {
                const isSelected = idx === selectedOshiIndex;
                const c = o.color || themeColor;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOshiIndex(idx)}
                    className={`oshi-switcher-item ${isSelected ? 'active' : ''}`}
                    style={isSelected ? { borderColor: c } : {}}
                  >
                    {o.image ? (
                      <img src={o.image} alt={o.name} className="oshi-switcher-avatar" />
                    ) : (
                      <span
                        className="oshi-switcher-avatar-fallback"
                        style={{ backgroundColor: c }}
                      >
                        {o.name.slice(0, 1)}
                      </span>
                    )}
                    <span>{o.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 推しプロフィールヒーローカード (1:1正方形写真 + 属性 + 推し歴) */}
          <div className="oshi-hero-card">
            <div className="oshi-hero-main">
              {/* 正方形写真 */}
              <div className="oshi-hero-photo-box">
                {activeOshi.image ? (
                  <img
                    src={activeOshi.image}
                    alt={activeOshi.name}
                    className="oshi-hero-photo"
                    style={{
                      objectPosition: isAdjustingPosition
                        ? `center ${adjustPositionY}%`
                        : (activeOshi.imagePosition || 'center 20%'),
                    }}
                  />
                ) : (
                  <span className="oshi-hero-fallback">
                    {activeOshi.name.slice(0, 1)}
                  </span>
                )}
              </div>

              {/* 右側情報 */}
              <div className="oshi-hero-info">
                {/* 名前 */}
                <div className="oshi-hero-name">
                  {activeOshi.name}
                  {activeOshi.ruby && (
                    <span className="oshi-hero-ruby">({activeOshi.ruby})</span>
                  )}
                </div>

                {/* タグ (カテゴリ・所属) */}
                <div className="oshi-hero-badges">
                  {activeOshi.category && (
                    <span className="oshi-pill-tag">
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: oColor,
                        }}
                      />
                      {activeOshi.category}
                    </span>
                  )}
                  {activeOshi.group && (
                    <span className="oshi-pill-tag">{activeOshi.group}</span>
                  )}
                </div>

                {/* 推し歴カウント */}
                <div className="oshi-hero-days">
                  <span className="oshi-hero-days-label">推して</span>
                  <span className="oshi-hero-days-num" style={{ color: oColor }}>
                    {getOshiDaysSince(activeOshi) ?? '―'}
                  </span>
                  <span className="oshi-hero-days-label">日目</span>
                </div>

                {/* 写真の位置調整トリガー */}
                {activeOshi.image && !isAdjustingPosition && (
                  <button
                    type="button"
                    onClick={() => setIsAdjustingPosition(true)}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 6px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Sliders size={11} />
                    <span>位置調整</span>
                  </button>
                )}
              </div>
            </div>

            {/* 写真位置調整スライダー */}
            {isAdjustingPosition && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                  <span>写真の表示位置 (縦方向)</span>
                  <span>{adjustPositionY}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustPositionY}
                  onChange={(e) => setAdjustPositionY(Number(e.target.value))}
                  style={{ width: '100%', accentColor: oColor }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setAdjustPositionY(parseImagePositionY(activeOshi.imagePosition));
                      setIsAdjustingPosition(false);
                    }}
                    style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSavePosition}
                    disabled={isSavingPosition}
                    style={{ height: 32, padding: '0 14px', fontSize: 12, backgroundColor: oColor }}
                  >
                    {isSavingPosition ? '保存中...' : '位置を保存'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 2. 直近の重要締切（チケット申込・入金・予約締切） */}
      {upcomingDeadlines.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AlertCircle size={15} color="#EF4444" />
            <span>直近の重要締切 ({upcomingDeadlines.length}件)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {upcomingDeadlines.slice(0, 3).map((dl) => (
              <div
                key={dl.id}
                className="clean-card"
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  borderLeft: dl.daysLeft <= 1 ? '3px solid #EF4444' : '3px solid #F59E0B',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dl.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    期日: {dl.date.replace(/-/g, '/')}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: dl.daysLeft <= 1 ? '#EF444418' : '#F59E0B18',
                    color: dl.daysLeft <= 1 ? '#EF4444' : '#F59E0B',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {dl.daysLeft === 0 ? '本日締切！' : dl.daysLeft === 1 ? '明日まで！' : `あと${dl.daysLeft}日`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 今月の推し活支出スナップショット */}
      <div style={{ marginTop: 18 }}>
        <div
          className="clean-card"
          style={{
            padding: '12px 16px',
            cursor: onNavigateToTab ? 'pointer' : 'default',
          }}
          onClick={() => onNavigateToTab && onNavigateToTab(3)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CreditCard size={14} />
              <span>今月の推し活支出</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              目標: ¥{monthlyBudget.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
              ¥{currentMonthTotal.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: currentMonthTotal > monthlyBudget ? '#EF4444' : 'var(--text-secondary)' }}>
              ({budgetRatio}%)
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: 5,
              borderRadius: 3,
              backgroundColor: 'var(--bg-surface-subtle)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${budgetRatio}%`,
                backgroundColor: currentMonthTotal > monthlyBudget ? '#EF4444' : oColor,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. 次の予定 (カウントダウン) */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            次の予定
          </div>
          <button
            type="button"
            onClick={onOpenAddEvent}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: oColor,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={14} />
            <span>予定を追加</span>
          </button>
        </div>

        {nextEvent ? (
          (() => {
            const isToday = isTodayDate(nextEvent.date);
            const daysUntil = getDaysUntilDate(nextEvent.date);
            const parsedDate = parseLocalDate(nextEvent.date) || new Date();
            const label = isToday ? '本日' : daysUntil > 0 ? `あと${daysUntil}日` : '';
            return (
              <div
                className="clean-card"
                onClick={() => onOpenEditEvent(nextEvent)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  className={`schedule-date-box ${isToday ? 'is-today' : ''}`}
                  style={isToday ? { backgroundColor: oColor } : {}}
                >
                  <span className="schedule-date-month">{parsedDate.getMonth() + 1}月</span>
                  <span className="schedule-date-day">{parsedDate.getDate()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {label && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          backgroundColor: isToday ? `${oColor}20` : 'var(--bg-surface-subtle)',
                          color: isToday ? oColor : 'var(--text-secondary)',
                        }}
                      >
                        {label}
                      </span>
                    )}
                    {nextEvent.time && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} />
                        {nextEvent.time}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nextEvent.title}
                  </div>
                  {nextEvent.location && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin size={11} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextEvent.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div
            className="clean-card"
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            登録された予定はありません
          </div>
        )}
      </div>

      {/* 3. 直近の予定リスト */}
      {otherUpcomingEvents.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            その後の予定
          </div>
          <div className="schedule-list">
            {otherUpcomingEvents.map((ev) => {
              const d = parseLocalDate(ev.date) || new Date();
              return (
                <div
                  key={ev.id}
                  className="schedule-item"
                  onClick={() => onOpenEditEvent(ev)}
                >
                  <div className="schedule-date-box">
                    <span className="schedule-date-month">{d.getMonth() + 1}月</span>
                    <span className="schedule-date-day">{d.getDate()}</span>
                  </div>
                  <div className="schedule-content">
                    <div className="schedule-title">{ev.title}</div>
                    <div className="schedule-meta">
                      {ev.time && <span>{ev.time}</span>}
                      {ev.location && <span>{ev.location}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. 参戦準備・TODO */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            参戦準備・やること ({incompleteTodos.length})
          </div>
          <button
            type="button"
            onClick={onOpenAddTodo}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: oColor,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={14} />
            <span>TODOを追加</span>
          </button>
        </div>

        {incompleteTodos.length === 0 && completedTodos.length === 0 ? (
          <div
            className="clean-card"
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            参戦準備やTODOはありません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {incompleteTodos.map((todo) => (
              <div
                key={todo.id}
                className="todo-item"
                onClick={() => handleToggleTodo(todo)}
              >
                <div className="todo-checkbox" style={{ borderColor: oColor }} />
                <span className="todo-title">{todo.title}</span>
                {todo.dueDate && (
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {todo.dueDate.replace(/-/g, '/')}
                  </span>
                )}
              </div>
            ))}

            {completedTodos.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCompletedTodos(!showCompletedTodos)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    padding: '4px 0',
                  }}
                >
                  {showCompletedTodos ? '完了した項目を隠す' : `完了した項目を表示 (${completedTodos.length})`}
                </button>
                {showCompletedTodos && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                    {completedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="todo-item"
                        onClick={() => handleToggleTodo(todo)}
                        style={{ opacity: 0.6 }}
                      >
                        <div
                          className="todo-checkbox checked"
                          style={{ backgroundColor: oColor, borderColor: oColor }}
                        >
                          <CheckSquare size={14} color="#FFFFFF" />
                        </div>
                        <span className="todo-title completed">{todo.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
