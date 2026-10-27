import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Heart,
  CheckSquare,
  Sparkles,
  Gift,
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Sliders,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { oshiRepository, todoRepository } from '../repository';
import type { OshiEvent, Todo } from '../types';
import {
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
}) => {
  const {
    oshis,
    events,
    todos,
    themeColor,
    isDark,
    refreshAllData,
    recoverableBackup,
    restoreRecoverableBackup,
    showToast,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [selectedOshiIndex, setSelectedOshiIndex] = useState<number>(0);
  const [showCompletedTodos, setShowCompletedTodos] = useState<boolean>(false);
  const [isAdjustingPosition, setIsAdjustingPosition] = useState<boolean>(false);
  const [adjustPositionY, setAdjustPositionY] = useState<number>(20);
  const [isSavingPosition, setIsSavingPosition] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

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
      showToast('推しの表示位置を保存しました', 'success');
    } catch {
      showToast('表示位置の保存に失敗しました', 'error');
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
  const upcomingEvents = futureEvents;
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

  // 次のイベント以外の直近予定（最大4件）
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
    if (nextCompleted) {
      showToast('完了にしました', 'success');
    }
  };

  return (
    <div className="page-padding">
      {/* 復元可能なバックアップが見つかった場合の通知 */}
      {recoverableBackup && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 18px',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: 14,
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
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            復元
          </button>
        </div>
      )}

      {/* 1. トップ：推しのシネマティック・アーティストヒーロー */}
      {activeOshi ? (
        <div style={{ marginBottom: 32 }}>
          {/* 複数推しがいる場合のセレクタータブ */}
          {oshis.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                marginBottom: 14,
                paddingBottom: 4,
              }}
            >
              {oshis.map((o, idx) => {
                const isSelected = idx === selectedOshiIndex;
                const c = o.color || themeColor;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOshiIndex(idx)}
                    className={`oshi-pill ${isSelected ? 'active' : ''}`}
                    style={isSelected ? { borderColor: c, backgroundColor: `${c}15` } : {}}
                  >
                    <div
                      className="oshi-pill-avatar"
                      style={{ backgroundColor: `${c}25` }}
                    >
                      {o.image ? (
                        <img src={o.image} alt={o.name} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: c }}>
                          {o.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <span
                      className="oshi-pill-label"
                      style={isSelected ? { color: c } : {}}
                    >
                      {o.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* シネマティック・アーティストカバー */}
          <div className="artist-hero">
            {activeOshi.image ? (
              <>
                <img
                  src={activeOshi.image}
                  alt={activeOshi.name}
                  className="artist-hero-image"
                  style={{
                    objectPosition: isAdjustingPosition
                      ? `center ${adjustPositionY}%`
                      : (activeOshi.imagePosition || 'center 20%'),
                  }}
                />
                <div className="artist-hero-gradient" />

                {/* 位置調整ボタン */}
                {!isAdjustingPosition && (
                  <button
                    type="button"
                    className="artist-hero-adjust-btn"
                    onClick={() => {
                      setAdjustPositionY(parseImagePositionY(activeOshi.imagePosition));
                      setIsAdjustingPosition(true);
                    }}
                    aria-label="画像の位置を調整"
                  >
                    <Sliders size={13} />
                    <span>位置調整</span>
                  </button>
                )}

                {/* 位置調整パネル */}
                {isAdjustingPosition && (
                  <div className="artist-hero-adjust-panel">
                    <div className="artist-hero-adjust-header">
                      <span className="artist-hero-adjust-title">推しの表示位置を調整</span>
                      <span className="artist-hero-adjust-value">{adjustPositionY}%</span>
                    </div>
                    <div className="artist-hero-adjust-slider-wrap">
                      <span className="artist-hero-adjust-hint">上</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={adjustPositionY}
                        onChange={(e) => setAdjustPositionY(Number(e.target.value))}
                        className="artist-hero-adjust-slider"
                      />
                      <span className="artist-hero-adjust-hint">下</span>
                    </div>
                    <div className="artist-hero-adjust-presets">
                      {[
                        { label: '顔優先 (15%)', val: 15 },
                        { label: '標準 (25%)', val: 25 },
                        { label: '中央 (50%)', val: 50 },
                        { label: '下部 (75%)', val: 75 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          className={`artist-hero-preset-btn ${adjustPositionY === preset.val ? 'active' : ''}`}
                          onClick={() => setAdjustPositionY(preset.val)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div className="artist-hero-adjust-actions">
                      <button
                        type="button"
                        className="artist-hero-adjust-cancel"
                        onClick={() => {
                          setIsAdjustingPosition(false);
                          setAdjustPositionY(parseImagePositionY(activeOshi.imagePosition));
                        }}
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        className="artist-hero-adjust-save"
                        style={{ backgroundColor: oColor }}
                        onClick={handleSavePosition}
                        disabled={isSavingPosition}
                      >
                        <Check size={14} />
                        <span>{isSavingPosition ? '保存中...' : '位置を保存'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, ${oColor}77 0%, #090A0D 100%)`,
                }}
              />
            )}

            {/* 下部：推し名 ＆ 静謐なメタ情報 */}
            <div className="artist-hero-content">
              <h1 className="artist-hero-name">{activeOshi.name}</h1>

              <div className="artist-hero-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Heart size={13} fill="currentColor" style={{ opacity: 0.9 }} />
                  <span>
                    {getOshiDaysSince(activeOshi) !== null
                      ? `推して ${getOshiDaysSince(activeOshi)}日目`
                      : '応援中'}
                  </span>
                </div>

                {activeOshi.birthday && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Gift size={13} style={{ opacity: 0.85 }} />
                    <span>誕生日 {activeOshi.birthday.replace(/-/g, '/')}</span>
                    {isBirthdayToday(activeOshi) && (
                      <span
                        style={{
                          backgroundColor: '#FF2D55',
                          color: '#FFFFFF',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        TODAY
                      </span>
                    )}
                  </div>
                )}

                {activeOshi.debutDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={13} style={{ opacity: 0.85 }} />
                    <span>デビュー {activeOshi.debutDate.replace(/-/g, '/')}</span>
                    {isDebutAnniversaryToday(activeOshi) && (
                      <span
                        style={{
                          backgroundColor: '#FF9500',
                          color: '#FFFFFF',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {getDebutYears(activeOshi)}周年
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 推し未登録時のウェルカム */
        <div
          style={{
            marginBottom: 32,
            padding: '36px 24px',
            borderRadius: 24,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: 'rgba(var(--oshi-color-rgb), 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart size={24} color="var(--oshi-color)" />
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            あなたの推しを登録しましょう
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 6,
              lineHeight: 1.6,
            }}
          >
            マイページから推しの写真や記念日を設定すると、<br />
            あなた専用の推し活スペースが完成します。
          </div>
        </div>
      )}

      {/* 2. メインコンテンツ（左：スケジュール、右：参戦準備・ToDo） */}
      <div className="home-grid">
        {/* 左カラム：ライブ・イベントスケジュール */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div className="section-header">
              <div className="section-title">
                <Calendar size={17} strokeWidth={2.2} />
                <span>直近の予定</span>
              </div>
              <button
                type="button"
                onClick={onOpenAddEvent}
                className="section-action"
                style={{ color: oColor }}
              >
                ＋ 予定を追加
              </button>
            </div>

            {nextEvent ? (
              (() => {
                const isToday = isTodayDate(nextEvent.date);
                const parsedDate = parseLocalDate(nextEvent.date);
                const monthText = parsedDate ? `${parsedDate.getMonth() + 1}月` : '--';
                const dayText = parsedDate ? `${parsedDate.getDate()}` : '--';
                const weekdayText = parsedDate ? getWeekdayJa(parsedDate) : '';
                const countdown = getEventCountdownInfo(nextEvent, currentTime);

                return (
                  <div
                    onClick={() => onOpenEditEvent(nextEvent)}
                    className={`event-row ${isToday ? 'is-today' : ''}`}
                    style={isToday ? { borderColor: `${oColor}88` } : {}}
                  >
                    {/* Apple Music風 日付ブロック */}
                    <div
                      className={`event-date-block ${isToday ? 'is-today' : ''}`}
                      style={isToday ? { backgroundColor: oColor, borderColor: oColor } : {}}
                    >
                      <span className="event-date-month">{monthText}</span>
                      <span className="event-date-day">{dayText}</span>
                    </div>

                    {/* イベント詳細 */}
                    <div className="event-info">
                      <div className="event-title" style={isToday ? { fontWeight: 700 } : {}}>
                        {nextEvent.title}
                      </div>
                      <div className="event-meta">
                        <div className="event-meta-item">
                          <span>{weekdayText ? `(${weekdayText})` : ''} {nextEvent.time || '終日'}</span>
                        </div>
                        {nextEvent.location && nextEvent.location.trim() && (
                          <div className="event-meta-item">
                            <MapPin size={12} strokeWidth={2} />
                            <span>{nextEvent.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* カウントダウン / 本日開催バッジ（この1箇所のみ） */}
                    {isToday ? (
                      <div
                        className="live-badge"
                        style={{
                          backgroundColor: oColor,
                          boxShadow: `0 2px 8px ${oColor}44`,
                        }}
                      >
                        <span>本日開催</span>
                      </div>
                    ) : (
                      <div
                        className="event-countdown-pill"
                        style={{
                          backgroundColor: `${oColor}18`,
                          color: oColor,
                        }}
                      >
                        {countdown.shortCountdown || countdown.hoursLabel}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div
                onClick={onOpenAddEvent}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 18,
                  border: '1px solid var(--border-subtle)',
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  予定はありません
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  ライブ・イベント・配信などの予定を記録しよう
                </div>
              </div>
            )}
          </div>

          {/* 今後の予定リスト（複数ある場合） */}
          {otherUpcomingEvents.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 10,
                }}
              >
                今後の予定
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {otherUpcomingEvents.map((e) => {
                  const isToday = isTodayDate(e.date);
                  const d = parseLocalDate(e.date);
                  const m = isToday ? 'TODAY' : d ? `${d.getMonth() + 1}月` : '--';
                  const dy = d ? `${d.getDate()}` : '--';
                  const w = d ? `(${getWeekdayJa(d)})` : '';
                  const cd = getEventCountdownInfo(e, currentTime);

                  return (
                    <div
                      key={e.id}
                      onClick={() => onOpenEditEvent(e)}
                      className="event-row"
                      style={{ padding: '12px 14px' }}
                    >
                      <div
                        className="event-date-block"
                        style={{ width: 44, height: 46 }}
                      >
                        <span className="event-date-month" style={{ fontSize: 9.5 }}>{m}</span>
                        <span className="event-date-day" style={{ fontSize: 16 }}>{dy}</span>
                      </div>
                      <div className="event-info">
                        <div className="event-title" style={{ fontSize: 14 }}>
                          {e.title}
                        </div>
                        <div className="event-meta" style={{ fontSize: 12 }}>
                          <span>{w} {e.time || '終日'}</span>
                          {e.location && (
                            <div className="event-meta-item">
                              <MapPin size={11} strokeWidth={2} />
                              <span>{e.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {cd.shortCountdown && (
                        <div
                          className="event-countdown-pill"
                          style={{
                            backgroundColor: `${oColor}12`,
                            color: oColor,
                            fontSize: 11,
                          }}
                        >
                          {cd.shortCountdown}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 右カラム：参戦準備・ToDo */}
        <div>
          <div className="section-header">
            <div className="section-title">
              <CheckSquare size={17} strokeWidth={2.2} />
              <span>参戦準備・ToDo ({incompleteTodos.length})</span>
            </div>
            <button
              type="button"
              onClick={onOpenAddTodo}
              className="section-action"
              style={{ color: oColor }}
            >
              ＋ 追加
            </button>
          </div>

          {incompleteTodos.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 18,
                border: '1px solid var(--border-subtle)',
                padding: '32px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                すべての準備が完了しています
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                チケット申込、入金、持ち物チェックなどをメモしよう
              </div>
            </div>
          ) : (
            <div className="reminder-list">
              {incompleteTodos.map((t) => {
                const dueDays = t.dueDate ? getDaysUntilDate(t.dueDate) : null;
                const dueParsed = parseLocalDate(t.dueDate);
                const isOverdue = dueDays !== null && dueDays < 0;
                const isDueSoon = dueDays !== null && (dueDays === 0 || dueDays === 1);
                const dueLabel = dueParsed
                  ? dueDays === 0
                    ? '今日まで'
                    : dueDays === 1
                      ? '明日まで'
                      : isOverdue
                        ? '期限切れ'
                        : `${dueParsed.getMonth() + 1}/${dueParsed.getDate()}`
                  : null;

                return (
                  <div
                    key={t.id}
                    onClick={() => onOpenEditTodo(t)}
                    className="reminder-item"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTodo(t);
                      }}
                      aria-label="完了にする"
                      className="reminder-check-btn"
                      style={isDueSoon ? { borderColor: '#FF3B30' } : {}}
                    />

                    <div className="reminder-text">
                      {t.title}
                    </div>

                    {dueLabel && (
                      <span className={`reminder-tag ${isOverdue ? 'urgent' : ''}`}>
                        {dueLabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 完了済みアコーディオン */}
          {completedTodos.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowCompletedTodos((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 0',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {showCompletedTodos ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>完了した準備 ({completedTodos.length})</span>
              </button>

              {showCompletedTodos && (
                <div className="reminder-list" style={{ marginTop: 8 }}>
                  {completedTodos.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenEditTodo(t)}
                      className="reminder-item"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTodo(t);
                        }}
                        className="reminder-check-btn checked"
                        style={{ backgroundColor: oColor, borderColor: oColor }}
                      >
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </button>
                      <span className="reminder-text completed">
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
