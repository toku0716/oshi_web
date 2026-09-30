import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { OshiEvent } from '../types';
import { EventCategoryBadge, TicketStatusBadge } from '../components/common/Badge';
import { formatJapaneseDate, getDaysDiff } from '../utils/helpers';
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
    <div className="space-y-6 pb-12">
      {/* Calendar Header */}
      <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentYear}年 {currentMonth}月
            </h2>
            <button
              onClick={goToToday}
              className="text-xs px-2.5 py-1 rounded-lg bg-pink-50 text-pink-600 font-bold hover:bg-pink-100 transition"
            >
              今日
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200/60">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-gray-600 hover:bg-white hover:shadow-xs transition"
                aria-label="前月"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-gray-600 hover:bg-white hover:shadow-xs transition"
                aria-label="次月"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onOpenEventModal(selectedDate)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>予定を追加</span>
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-2">
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
                className={`min-h-[56px] sm:min-h-[78px] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl transition flex flex-col justify-between text-left relative border ${
                  isSelected
                    ? 'ring-2 ring-pink-500 border-pink-400 bg-pink-50/40 shadow-xs'
                    : isToday
                    ? 'border-pink-300 bg-pink-50/20'
                    : 'border-gray-100 hover:bg-gray-50/80 bg-white'
                } ${!cell.isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-pink-500 text-white shadow-xs'
                        : isSunday
                        ? 'text-rose-600'
                        : isSaturday
                        ? 'text-sky-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-400 hidden sm:inline">
                      {dayEvents.length}件
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
                        className="text-[10px] truncate px-1 py-0.2 rounded font-medium text-gray-700 hidden sm:block border-l-2"
                        style={{
                          borderColor: oshi?.color || '#ec4899',
                          backgroundColor: oshi ? `${oshi.color}15` : '#fdf2f8',
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
                    <div className="hidden sm:block text-[9px] text-gray-400 font-semibold px-1">
                      他 +{dayEvents.length - 2}件
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-pink-500" />
            <h3 className="font-extrabold text-base text-gray-900">
              {formatJapaneseDate(selectedDate)} の予定
            </h3>
            <span className="text-xs text-gray-400 font-bold">
              ({selectedDateEvents.length}件)
            </span>
          </div>

          <button
            onClick={() => onOpenEventModal(selectedDate)}
            className="text-xs font-bold text-pink-600 hover:text-pink-700 inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            この日に予定を追加
          </button>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
            <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">この日の予定はありません</p>
            <button
              onClick={() => onOpenEventModal(selectedDate)}
              className="px-3.5 py-1.5 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 text-xs font-bold transition inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>予定を登録する</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateEvents.map((ev) => {
              const oshi = oshis.find((o) => o.id === ev.oshiId);
              const daysDiff = getDaysDiff(ev.date);

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="p-4 rounded-2xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/20 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-pink-100 transition">
                      <CalendarIcon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <EventCategoryBadge category={ev.category} />
                        <TicketStatusBadge status={ev.ticketStatus} />
                        {oshi && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-bold"
                            style={{ color: oshi.color }}
                          >
                            <Heart className="w-3 h-3 fill-current" />
                            <span>{oshi.name}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-gray-900 text-base group-hover:text-pink-600 transition">
                        {ev.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        {ev.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {ev.time}
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {ev.location}
                          </span>
                        )}
                      </div>

                      {ev.memo && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-1 bg-gray-50 px-2 py-0.5 rounded">
                          {ev.memo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span className="text-xs font-bold text-pink-600">
                      {daysDiff === 0 ? '本日開催' : daysDiff > 0 ? `あと${daysDiff}日` : '終了'}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
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
