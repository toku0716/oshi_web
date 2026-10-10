import React from 'react';
import { useApp } from '../context/AppContext';
import type { OshiEvent, Goods } from '../types';
import { getDaysSince, formatJapaneseDate, formatCurrency } from '../utils/helpers';
import { EventCategoryBadge, CountdownBadge } from '../components/common/Badge';
import {
  Calendar,
  Package,
  Plus,
  MapPin,
  ChevronRight,
  RotateCcw,
  Heart,
  Activity,
} from 'lucide-react';
import type { NavTab } from '../components/layout/Navbar';

interface HomeViewProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenEventModal: (date?: string) => void;
  onOpenGoodsModal: () => void;
  onOpenOshiModal: () => void;
  onSelectEvent: (event: OshiEvent) => void;
  onSelectGoods: (goods: Goods) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateTab,
  onOpenEventModal,
  onOpenGoodsModal,
  onOpenOshiModal,
  onSelectEvent,
  onSelectGoods,
}) => {
  const {
    oshis,
    events,
    goods,
    activeOshiId,
    activeOshi,
    recoverableBackup,
    restoreRecoverableBackup,
  } = useApp();

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter based on active oshi
  const filteredEvents = activeOshiId === 'all'
    ? events
    : events.filter((e) => e.oshiId === activeOshiId);

  const filteredGoods = activeOshiId === 'all'
    ? goods
    : goods.filter((g) => g.oshiId === activeOshiId);

  // Today's events
  const todayEvents = filteredEvents.filter((e) => e.date === todayStr);

  // Upcoming events (today or later, sorted by date asc)
  const upcomingEvents = filteredEvents
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 5);

  const nextEvent = upcomingEvents[0];

  // Recent Goods (up to 4)
  const recentGoods = [...filteredGoods]
    .sort((a, b) => (b.purchaseDate || b.createdAt).localeCompare(a.purchaseDate || a.createdAt))
    .slice(0, 4);

  // Calculations
  const totalGoodsSpent = filteredGoods.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const totalGoodsCount = filteredGoods.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const thisMonthStr = todayStr.slice(0, 7);
  const thisMonthEventsCount = filteredEvents.filter((e) => e.date.startsWith(thisMonthStr)).length;

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Recoverable Backup Recovery Banner */}
      {recoverableBackup && oshis.length === 0 && (
        <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-xs">
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                前回の推し活データが見つかりました
              </h4>
              <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                推し: {recoverableBackup.data.oshis?.length || 0}人 / 予定: {recoverableBackup.data.events?.length || 0}件 / グッズ: {recoverableBackup.data.goods?.length || 0}点 を復元できます。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={restoreRecoverableBackup}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition shrink-0"
          >
            データを復元
          </button>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
        {/* Main Oshi Card (Span 7) */}
        <div className="md:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 sm:p-6 flex flex-col justify-between min-h-[200px]">
          {oshis.length === 0 ? (
            <div className="h-full flex flex-col justify-between py-1">
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">はじめに</span>
                <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white mt-1">
                  推しを登録して推し活を始めましょう！
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  アイドル、俳優、キャラクター、VTuberなどの推しを登録すると、ライブやイベントの予定、推し始めてからの日数、グッズをまとめて管理できます。
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={onOpenOshiModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs hover:opacity-90 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>推しを登録する</span>
                </button>
              </div>
            </div>
          ) : activeOshi ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-subtle)] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-base shadow-2xs"
                    style={{
                      color: activeOshi.color || '#ec4899',
                    }}
                  >
                    {activeOshi.image ? (
                      <img
                        src={activeOshi.image}
                        alt={activeOshi.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeOshi.name.slice(0, 1)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {activeOshi.category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-[var(--border-subtle)]">
                          {activeOshi.category}
                        </span>
                      )}
                      {activeOshi.group && (
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                          {activeOshi.group}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white leading-tight">
                      {activeOshi.name}
                    </h2>
                  </div>
                </div>

                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{
                    backgroundColor: activeOshi.color || '#ec4899',
                  }}
                  title="推しカラー"
                />
              </div>

              {/* Tracking Days & Action Buttons */}
              <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-end justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium block">
                    {activeOshi.debutDate ? '推し始めてから' : '推しステータス'}
                  </span>
                  {activeOshi.debutDate ? (
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-extrabold tracking-tight num-tabular text-neutral-950 dark:text-white">
                        {getDaysSince(activeOshi.debutDate)}
                      </span>
                      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">日目</span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      応援中
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenEventModal()}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-neutral-400" />
                    <span>予定を追加</span>
                  </button>
                  <button
                    onClick={onOpenGoodsModal}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-neutral-400" />
                    <span>グッズを登録</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">推し活サマリー</span>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                  推し活ダッシュボード
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  推し <strong className="text-neutral-900 dark:text-white num-tabular">{oshis.length}</strong> 人の予定とグッズをまとめて表示中
                </p>
              </div>

              {/* Oshi Stack */}
              <div className="pt-4 flex items-center justify-between border-t border-[var(--border-subtle)]">
                <div className="flex -space-x-1.5 overflow-hidden py-1">
                  {oshis.slice(0, 6).map((o) => (
                    <div
                      key={o.id}
                      className="w-6 h-6 rounded-md border border-[var(--bg-surface)] bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: o.color || '#ec4899' }}
                    >
                      {o.name.slice(0, 1)}
                    </div>
                  ))}
                  {oshis.length > 6 && (
                    <div className="w-6 h-6 rounded-md border border-[var(--bg-surface)] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-semibold text-neutral-500">
                      +{oshis.length - 6}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onOpenEventModal()}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs hover:opacity-90 transition"
                >
                  ＋ 予定を追加
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Next Event & Metrics (Span 5) */}
        <div className="md:col-span-5 flex flex-col gap-3.5 sm:gap-4">
          {/* Next Event Card */}
          <div
            onClick={() => nextEvent && onSelectEvent(nextEvent)}
            className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 flex-1 flex flex-col justify-between transition-colors ${
              nextEvent ? 'cursor-pointer hover:border-[var(--border-muted)]' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                次のイベント・ライブ
              </span>
              {nextEvent && <CountdownBadge date={nextEvent.date} size="sm" />}
            </div>

            {nextEvent ? (
              <div className="my-2">
                <h3 className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white line-clamp-1">
                  {nextEvent.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 num-tabular">
                    {formatJapaneseDate(nextEvent.date)}
                  </span>
                  {nextEvent.time && <span className="num-tabular">{nextEvent.time}</span>}
                  {nextEvent.location && (
                    <span className="flex items-center gap-0.5 truncate text-neutral-400">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {nextEvent.location}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="my-3 text-center py-2 text-xs text-neutral-400">
                <p>直近のイベント予定はありません</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEventModal();
                  }}
                  className="mt-1 text-neutral-700 dark:text-neutral-300 font-semibold hover:underline"
                >
                  予定を登録
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">予定: {upcomingEvents.length}件</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateTab('calendar');
                }}
                className="text-neutral-600 dark:text-neutral-300 font-medium hover:underline inline-flex items-center gap-0.5"
              >
                <span>予定カレンダー</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3.5">
              <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block">今月の予定</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-bold tracking-tight num-tabular text-neutral-950 dark:text-white">
                  {thisMonthEventsCount}
                </span>
                <span className="text-xs text-neutral-400">件</span>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3.5">
              <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block">グッズ総額</span>
              <div className="mt-1">
                <span className="text-base font-bold tracking-tight num-tabular text-neutral-950 dark:text-white truncate block">
                  {formatCurrency(totalGoodsSpent)}
                </span>
                <span className="text-[10px] text-neutral-400 block num-tabular">{totalGoodsCount} 点保有</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Alert (if any) */}
      {todayEvents.length > 0 && (
        <div className="rounded-xl p-4 bg-neutral-100 dark:bg-neutral-800/60 border border-[var(--border-subtle)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              本日の予定・イベント（{todayEvents.length}件）
            </span>
          </div>
          <div className="space-y-1.5">
            {todayEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-muted)] transition flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <EventCategoryBadge category={ev.category} />
                    {ev.time && <span className="text-xs font-medium text-neutral-500 num-tabular">{ev.time}</span>}
                  </div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-xs truncate">{ev.title}</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Upcoming Events & Recent Goods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Upcoming Events */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
              <h3 className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>これからの予定・イベント</span>
              </h3>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition flex items-center gap-0.5"
              >
                <span>すべて表示</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                <p>登録された予定はありません</p>
                <button
                  onClick={() => onOpenEventModal()}
                  className="mt-2 text-neutral-700 dark:text-neutral-300 font-semibold hover:underline"
                >
                  予定を新規作成
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {upcomingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="p-2.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-muted)] hover:bg-black/[0.01] dark:hover:bg-white/[0.01] cursor-pointer transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 num-tabular">
                          {formatJapaneseDate(ev.date)}
                        </span>
                        {ev.time && <span className="text-[11px] text-neutral-400 num-tabular">{ev.time}</span>}
                        <EventCategoryBadge category={ev.category} />
                      </div>
                      <h4 className="font-medium text-xs text-neutral-900 dark:text-white truncate">
                        {ev.title}
                      </h4>
                      {ev.location && (
                        <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{ev.location}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CountdownBadge date={ev.date} size="sm" />
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Goods */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
              <h3 className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-neutral-400" />
                <span>最近登録したグッズ</span>
              </h3>
              <button
                onClick={() => onNavigateTab('goods')}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition flex items-center gap-0.5"
              >
                <span>すべて表示</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {recentGoods.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                <p>登録されたグッズはありません</p>
                <button
                  onClick={onOpenGoodsModal}
                  className="mt-2 text-neutral-700 dark:text-neutral-300 font-semibold hover:underline"
                >
                  グッズを登録
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentGoods.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectGoods(item)}
                    className="p-2.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-muted)] hover:bg-black/[0.01] dark:hover:bg-white/[0.01] cursor-pointer transition flex items-center gap-2.5"
                  >
                    <div className="w-10 h-10 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-neutral-900 dark:text-white text-xs truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 num-tabular">
                        {formatCurrency(item.price)}
                      </p>
                      {item.storageLocation && (
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                          {item.storageLocation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
