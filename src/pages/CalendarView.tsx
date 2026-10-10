import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { OshiEvent } from '../types';
import { EventCategoryBadge, TicketStatusBadge, CountdownBadge } from '../components/common/Badge';
import { formatJapaneseDate } from '../utils/helpers';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Heart,
  ChevronRight as ArrowRightIcon,
} from 'lucide-react';

interface CalendarViewProps {
  onOpenEventModal: (date?: string) => void;
  onSelectEvent: (event: OshiEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenEventModal,
  onSelectEvent,
}) => {
  const { oshis, events, activeOshiId } = useApp();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDate(todayStr);
  };

  // Filter events based on activeOshiId
  const filteredEvents = activeOshiId === 'all'
    ? events
    : events.filter((e) => e.oshiId === activeOshiId);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = filteredEvents.reduce<Record<string, OshiEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  // Generate calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const m = currentMonth === 1 ? 12 : currentMonth - 1;
    const y = currentMonth === 1 ? currentYear - 1 : currentYear;
    calendarDays.push({
      day,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      day,
      dateStr,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete the 35 or 42 grid
  const remainingCells = 7 - (calendarDays.length % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      const m = currentMonth === 12 ? 1 : currentMonth + 1;
      const y = currentMonth === 12 ? currentYear + 1 : currentYear;
      calendarDays.push({
        day,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }
  }

  const selectedDateEvents = eventsByDate[selectedDate] || [];

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Calendar Header Card */}
      <div className="bento-card rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white num-tabular">
              {currentYear}年 {currentMonth}月
            </h2>
            <button
              onClick={goToToday}
              className="text-[11px] px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-neutral-700 dark:text-neutral-300 font-semibold transition"
            >
              今日
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.05] rounded-xl p-1 border border-[var(--border-subtle)]">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition"
                aria-label="前月"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition"
                aria-label="次月"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onOpenEventModal(selectedDate)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs shadow-xs active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>イベントを追加</span>
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-neutral-400 mb-1.5 tracking-tight">
          <span className="text-rose-500">日</span>
          <span>月</span>
          <span>火</span>
          <span>水</span>
          <span>木</span>
          <span>金</span>
          <span className="text-sky-500">土</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((cell, idx) => {
            const dayEvents = eventsByDate[cell.dateStr] || [];
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const dayOfWeek = idx % 7;
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`min-h-[58px] sm:min-h-[76px] p-1.5 rounded-xl transition-all flex flex-col justify-between text-left relative border ${
                  isSelected
                    ? 'ring-2 ring-neutral-900 dark:ring-white border-transparent bg-black/[0.03] dark:bg-white/[0.08]'
                    : isToday
                    ? 'border-neutral-400/60 dark:border-neutral-500/60 bg-black/[0.01] dark:bg-white/[0.02]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-muted)] bg-[var(--bg-surface)]'
                } ${!cell.isCurrentMonth ? 'opacity-35' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs num-tabular w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                        : isSunday
                        ? 'text-rose-600 font-semibold'
                        : isSaturday
                        ? 'text-sky-600 font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 font-medium'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-semibold text-neutral-400 hidden sm:inline num-tabular">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Dots / Chips on the day */}
                <div className="w-full space-y-0.5 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const oshi = oshis.find((o) => o.id === ev.oshiId);
                    return (
                      <div
                        key={ev.id}
                        className="text-[10px] truncate px-1 py-0.2 rounded font-medium text-neutral-800 dark:text-neutral-200 hidden sm:block border-l-2"
                        style={{
                          borderColor: oshi?.color || '#ec4899',
                          backgroundColor: oshi ? `${oshi.color}15` : 'rgba(0,0,0,0.04)',
                        }}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 0 && (
                    <div className="sm:hidden flex justify-center gap-1 mt-1">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const oshi = oshis.find((o) => o.id === ev.oshiId);
                        return (
                          <span
                            key={ev.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: oshi?.color || '#ec4899' }}
                          />
                        );
                      })}
                    </div>
                  )}
                  {dayEvents.length > 2 && (
                    <div className="hidden sm:block text-[9px] text-neutral-400 font-medium px-1 num-tabular">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events List */}
      <div className="bento-card rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarIcon className="w-4 h-4 text-neutral-400" />
            <h3 className="font-bold text-sm text-neutral-950 dark:text-white num-tabular">
              {formatJapaneseDate(selectedDate)}
            </h3>
            <span className="text-xs text-neutral-400 font-medium num-tabular">
              ({selectedDateEvents.length}件)
            </span>
            <CountdownBadge date={selectedDate} size="sm" />
          </div>

          <button
            onClick={() => onOpenEventModal(selectedDate)}
            className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white inline-flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>イベントを追加</span>
          </button>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="text-center py-8 bg-black/[0.01] dark:bg-white/[0.01] rounded-lg border border-dashed border-[var(--border-subtle)]">
            <p className="text-xs text-neutral-400 mb-2">この日の登録イベントはありません</p>
            <button
              onClick={() => onOpenEventModal(selectedDate)}
              className="px-3 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>イベントを登録</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateEvents.map((ev) => {
              const oshi = oshis.find((o) => o.id === ev.oshiId);

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="p-3.5 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-muted)] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <EventCategoryBadge category={ev.category} />
                        <TicketStatusBadge status={ev.ticketStatus} />
                        {oshi && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold"
                            style={{ color: oshi.color }}
                          >
                            <Heart className="w-3 h-3 fill-current" />
                            <span>{oshi.name}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-neutral-900 dark:text-white text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition truncate">
                        {ev.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-neutral-400">
                        {ev.time && (
                          <span className="flex items-center gap-1 num-tabular">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {ev.time}
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-400" />
                            {ev.location}
                          </span>
                        )}
                      </div>

                      {ev.memo && (
                        <p className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
                          {ev.memo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                    <CountdownBadge date={ev.date} size="sm" />
                    <ArrowRightIcon className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
