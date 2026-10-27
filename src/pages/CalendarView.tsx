import React, { useState } from 'react';
import { Gift, Sparkles, MapPin, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { todoRepository } from '../repository';
import type { OshiEvent, Todo } from '../types';
import {
  formatIsoDate,
  getTodayMidnight,
  getWeekdayJa,
  isSameDay,
  isTodayDate,
  parseLocalDate,
  sortEventsByTime,
} from '../utils/oshiUtils';

interface CalendarViewProps {
  onOpenAddEvent: (defaultDate: string) => void;
  onOpenEditEvent: (event: OshiEvent) => void;
  onOpenEditTodo: (todo: Todo) => void;
  onSelectedDateChange?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenAddEvent,
  onOpenEditEvent,
  onOpenEditTodo,
  onSelectedDateChange,
}) => {
  const { events, todos, activeOshi, themeColor, isDark, refreshAllData, showToast } = useApp();

  const today = getTodayMidnight();
  const [focusedMonth, setFocusedMonth] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDateState] = useState<Date>(() => today);

  const setSelectedDate = (nextDate: Date) => {
    setSelectedDateState(nextDate);
    if (onSelectedDateChange) {
      onSelectedDateChange(formatIsoDate(nextDate));
    }
  };

  const year = focusedMonth.getFullYear();
  const month = focusedMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay();

  const selectedDateStr = formatIsoDate(selectedDate);

  const selectedEvents = sortEventsByTime(
    events.filter((e) => e.date === selectedDateStr)
  );
  const selectedTodos = todos.filter((t) => t.dueDate === selectedDateStr);
  const totalSelectedCount = selectedEvents.length + selectedTodos.length;

  const hasEntryOnDate = (d: Date): boolean => {
    const iso = formatIsoDate(d);
    return (
      events.some((e) => e.date === iso) ||
      todos.some((t) => t.dueDate === iso)
    );
  };

  // 推しの誕生日・記念日判定
  const isOshiBirthday = (d: Date): boolean => {
    if (!activeOshi?.birthday) return false;
    const b = parseLocalDate(activeOshi.birthday);
    return b ? b.getMonth() === d.getMonth() && b.getDate() === d.getDate() : false;
  };

  const isOshiDebut = (d: Date): boolean => {
    if (!activeOshi?.debutDate) return false;
    const deb = parseLocalDate(activeOshi.debutDate);
    return deb ? deb.getMonth() === d.getMonth() && deb.getDate() === d.getDate() : false;
  };

  // 今月に推しの記念日があるかチェック
  const monthBirthday = activeOshi?.birthday ? parseLocalDate(activeOshi.birthday) : null;
  const hasBirthdayThisMonth = monthBirthday && monthBirthday.getMonth() === month;

  const monthDebut = activeOshi?.debutDate ? parseLocalDate(activeOshi.debutDate) : null;
  const hasDebutThisMonth = monthDebut && monthDebut.getMonth() === month;

  const isSelectedBirthday = isOshiBirthday(selectedDate);
  const isSelectedDebut = isOshiDebut(selectedDate);

  const handleToggleTodo = async (todo: Todo) => {
    await todoRepository.save({
      ...todo,
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
    await refreshAllData();
  };

  const cardBg = 'var(--bg-surface-elevated)';
  const borderColor = 'var(--border-subtle)';
  const textColor = 'var(--text-primary)';
  const subtextColor = 'var(--text-secondary)';

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const totalCells = startWeekday + daysInMonth;

  return (
    <div className="calendar-grid-layout page-padding">
      {/* カレンダーコンポーネント */}
      <div>
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: 22,
            border: `1.5px solid ${borderColor}`,
            padding: '18px 16px 22px',
            boxShadow: isDark
              ? '0 10px 30px -10px rgba(0,0,0,0.5)'
              : `0 10px 30px -10px ${themeColor}1A`,
          }}
        >
          {/* 今月の推し記念日バナー */}
          {(hasBirthdayThisMonth || hasDebutThisMonth) && activeOshi && (
            <div
              style={{
                marginBottom: 14,
                padding: '8px 12px',
                borderRadius: 12,
                background: `linear-gradient(90deg, ${themeColor}18, transparent)`,
                borderLeft: `3px solid ${themeColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                fontWeight: 600,
                color: textColor,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {hasBirthdayThisMonth ? (
                  <Gift size={15} color={themeColor} strokeWidth={2.2} />
                ) : (
                  <Sparkles size={15} color={themeColor} strokeWidth={2.2} />
                )}
                <span>
                  今月は {activeOshi.name} の
                  {hasBirthdayThisMonth
                    ? `お誕生日月 (${monthBirthday?.getDate()}日)`
                    : `デビュー記念月 (${monthDebut?.getDate()}日)`}
                  です
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const targetDay = hasBirthdayThisMonth ? monthBirthday?.getDate() : monthDebut?.getDate();
                  if (targetDay) {
                    setSelectedDate(new Date(year, month, targetDay));
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: themeColor,
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                移動 →
              </button>
            </div>
          )}

          {/* 年月ヘッダー + 操作ボタン */}
          <div
            style={{
              padding: '2px 4px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: textColor,
                }}
              >
                {year}年 {month + 1}月
              </h1>
              {activeOshi && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: `${themeColor}1F`,
                    color: themeColor,
                  }}
                >
                  {activeOshi.name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  const now = getTodayMidnight();
                  setFocusedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedDate(now);
                }}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '5px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              >
                今日
              </button>
              <button
                type="button"
                onClick={() => setFocusedMonth(new Date(year, month - 1, 1))}
                style={{
                  background: 'var(--bg-surface-subtle)',
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontSize: 18,
                  fontWeight: 700,
                }}
                aria-label="前月"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setFocusedMonth(new Date(year, month + 1, 1))}
                style={{
                  background: 'var(--bg-surface-subtle)',
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontSize: 18,
                  fontWeight: 700,
                }}
                aria-label="次月"
              >
                ›
              </button>
            </div>
          </div>

          {/* 曜日ラベル */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              marginBottom: 8,
            }}
          >
            {weekdays.map((w, i) => (
              <div
                key={w}
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : subtextColor,
                  paddingBottom: 4,
                }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* マンスリー日付グリッド */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
            }}
          >
            {Array.from({ length: totalCells }).map((_, index) => {
              if (index < startWeekday) {
                return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
              }
              const day = index - startWeekday + 1;
              const date = new Date(year, month, day);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              const hasDot = hasEntryOnDate(date);
              const isBday = isOshiBirthday(date);
              const isDeb = isOshiDebut(date);

              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`${year}年${month + 1}月${day}日${hasDot ? '（予定あり）' : ''}${isBday ? '（推しの誕生日）' : ''}`}
                  onClick={() => {
                    setSelectedDate(date);
                  }}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 12,
                    border: isSelected
                      ? 'none'
                      : isToday
                      ? `2px solid ${themeColor}`
                      : isBday || isDeb
                      ? `1.5px dashed ${themeColor}`
                      : 'none',
                    backgroundColor: isSelected
                      ? themeColor
                      : isBday || isDeb
                      ? `${themeColor}12`
                      : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative',
                    boxShadow: isSelected
                      ? `0 4px 12px ${themeColor}66`
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: isSelected ? 800 : isToday || isBday ? 800 : 500,
                      color: isSelected
                        ? '#FFFFFF'
                        : isToday
                        ? themeColor
                        : textColor,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {day}
                  </span>

                  {/* 記念日マーク Gift / Sparkles または予定ドット */}
                  {isBday ? (
                    <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Gift size={9} color={isSelected ? '#FFFFFF' : themeColor} strokeWidth={2.4} />
                    </div>
                  ) : isDeb ? (
                    <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={9} color={isSelected ? '#FFFFFF' : themeColor} strokeWidth={2.4} />
                    </div>
                  ) : hasDot ? (
                    <span
                      style={{
                        marginTop: 2,
                        width: 4.5,
                        height: 4.5,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#FFFFFF' : themeColor,
                      }}
                    />
                  ) : (
                    <span style={{ height: 6.5 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 選択日の予定・やることリスト */}
      <div style={{ padding: '4px 0' }}>
        {/* 選択日の記念日スペシャルバナー */}
        {isSelectedBirthday && activeOshi && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: `1px solid var(--border-medium)`,
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${themeColor}26`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Gift size={24} color={themeColor} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: themeColor }}>
                {activeOshi.name} のお誕生日
              </div>
              <div style={{ fontSize: 12, color: subtextColor, marginTop: 2 }}>
                本日は推しのお誕生日です。特別な記念日をお祝いしましょう。
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast(`🎉 ${activeOshi.name}の誕生日をお祝いしました！`, 'success')}
              style={{
                backgroundColor: themeColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              お祝いする
            </button>
          </div>
        )}

        {isSelectedDebut && activeOshi && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: `1px solid var(--border-medium)`,
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${themeColor}26`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} color={themeColor} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: themeColor }}>
                {activeOshi.name} のデビュー記念日
              </div>
              <div style={{ fontSize: 12, color: subtextColor, marginTop: 2 }}>
                デビュー記念日です。これまでの活動に感謝を込めて。
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast(`✨ ${activeOshi.name}のデビュー記念日をお祝いしました！`, 'success')}
              style={{
                backgroundColor: themeColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              お祝いする
            </button>
          </div>
        )}

        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: textColor,
              }}
            >
              {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 ({getWeekdayJa(selectedDate)})
            </h2>
            {isSameDay(selectedDate, today) && (
              <span
                className="live-badge"
                style={{
                  backgroundColor: themeColor,
                  fontSize: 10.5,
                  padding: '2px 8px',
                }}
              >
                <span className="live-dot" />
                <span>本日</span>
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '1px 7px',
                borderRadius: 999,
                backgroundColor: totalSelectedCount > 0 ? `${themeColor}22` : (isDark ? '#232634' : '#E5E7EB'),
                color: totalSelectedCount > 0 ? themeColor : subtextColor,
              }}
            >
              {totalSelectedCount}件
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddEvent(selectedDateStr)}
            style={{
              background: 'none',
              border: 'none',
              color: themeColor,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>＋</span>
            <span>予定を追加</span>
          </button>
        </div>

        {totalSelectedCount === 0 ? (
          <div
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              border: `1.5px solid ${borderColor}`,
              padding: '36px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarDays size={22} color={subtextColor} strokeWidth={2} />
              </div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: textColor }}>
              この日の予定・タスクはありません
            </div>
            <div style={{ fontSize: 12, color: subtextColor, marginTop: 4 }}>
              ライブ参戦・配信・記念日などの予定を記録しよう
            </div>
            <button
              type="button"
              onClick={() => onOpenAddEvent(selectedDateStr)}
              style={{
                marginTop: 14,
                padding: '7px 18px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: themeColor,
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ＋ 予定を登録
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* イベントカード */}
            {selectedEvents.map((ev) => {
              const isToday = isTodayDate(ev.date);
              return (
                <div
                  key={ev.id}
                  onClick={() => onOpenEditEvent(ev)}
                  className={`event-row ${isToday ? 'is-today' : ''}`}
                  style={{ padding: '12px 16px', ...(isToday ? { borderColor: `${themeColor}88` } : {}) }}
                >
                  <div
                    className={`event-date-block ${isToday ? 'is-today' : ''}`}
                    style={{
                      width: 46,
                      height: 46,
                      ...(isToday ? { backgroundColor: themeColor, borderColor: themeColor } : {}),
                    }}
                  >
                    <span className="event-date-month" style={{ fontSize: 9.5 }}>{isToday ? 'TODAY' : '時間'}</span>
                    <span className="event-date-day" style={{ fontSize: 13, fontWeight: 700 }}>
                      {ev.time ? ev.time : '終日'}
                    </span>
                  </div>

                  <div className="event-info">
                    <div className="event-title" style={{ fontWeight: isToday ? 700 : 600 }}>
                      {ev.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                      {ev.ticketStatus && ev.ticketStatus !== 'none' && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4,
                            backgroundColor: ev.ticketStatus === 'won' ? '#10B98120' : ev.ticketStatus === 'applied' ? '#3B82F620' : '#6B728020',
                            color: ev.ticketStatus === 'won' ? '#10B981' : ev.ticketStatus === 'applied' ? '#3B82F6' : '#6B7280',
                          }}
                        >
                          {ev.ticketStatus === 'won' ? '当選' : ev.ticketStatus === 'applied' ? '申込中' : ev.ticketStatus === 'purchased' ? '発券済' : '落選'}
                        </span>
                      )}

                      {ev.seatInfo && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          💺 {ev.seatInfo}
                        </span>
                      )}

                      {ev.ticketDeadline && (
                        <span style={{ fontSize: 10.5, color: '#EF4444', fontWeight: 600 }}>
                          申込締切: {ev.ticketDeadline.replace(/-/g, '/')}
                        </span>
                      )}

                      {ev.paymentDeadline && (
                        <span style={{ fontSize: 10.5, color: '#F59E0B', fontWeight: 600 }}>
                          入金締切: {ev.paymentDeadline.replace(/-/g, '/')}
                        </span>
                      )}
                    </div>

                    {ev.location && ev.location.trim() && (
                      <div className="event-meta" style={{ marginTop: 3 }}>
                        <div className="event-meta-item">
                          <MapPin size={11} strokeWidth={2} />
                          <span>{ev.location}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isToday && (
                    <div
                      className="live-badge"
                      style={{
                        backgroundColor: themeColor,
                        fontSize: 10.5,
                        padding: '3px 9px',
                      }}
                    >
                      <span>本日開催</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ToDoチェックリスト */}
            {selectedTodos.length > 0 && (
              <div className="reminder-list" style={{ marginTop: 6 }}>
                {selectedTodos.map((td) => (
                  <div
                    key={td.id}
                    onClick={() => onOpenEditTodo(td)}
                    className="reminder-item"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTodo(td);
                      }}
                      className={`reminder-check-btn ${td.completed ? 'checked' : ''}`}
                      style={td.completed ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                    >
                      {td.completed && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className={`reminder-text ${td.completed ? 'completed' : ''}`}>
                      {td.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
