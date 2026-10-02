import React from 'react';
import { useApp } from '../context/AppContext';
import type { OshiEvent, Goods } from '../types';
import { getDaysSince, formatJapaneseDate, formatCurrency, getDaysDiff } from '../utils/helpers';
import { EventCategoryBadge, CountdownBadge } from '../components/common/Badge';
import {
  Calendar,
  Package,
  Heart,
  Plus,
  Clock,
  MapPin,
  ChevronRight,
  TrendingUp,
  RotateCcw,
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
    <div className="space-y-6 pb-12">
      {/* Recoverable Backup Recovery Banner */}
      {recoverableBackup && oshis.length === 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-600/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-amber-950 dark:text-amber-100">
                  直前の保存控えが見つかりました！
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  復元可能
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                推し <strong>{recoverableBackup.data.oshis?.length || 0}人</strong>、予定 <strong>{recoverableBackup.data.events?.length || 0}件</strong>、グッズ <strong>{recoverableBackup.data.goods?.length || 0}点</strong> のデータをワンクリックで元通りに復元できます。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={restoreRecoverableBackup}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>直近データを復元する</span>
          </button>
        </div>
      )}

      {/* Top Oshi Summary Card */}
      {oshis.length === 0 ? (
        <div className="bg-white dark:bg-[#161822] rounded-xl p-6 border border-gray-200 dark:border-[#262838]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            推しが登録されていません
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            推しを登録すると、予定やグッズを推しごとに整理して管理できます。
          </p>
          <button
            onClick={onOpenOshiModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>推しを登録する</span>
          </button>
        </div>
      ) : activeOshi ? (
        <div className="bg-white dark:bg-[#161822] rounded-xl p-5 border border-gray-200 dark:border-[#262838] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg border border-gray-200 dark:border-[#262838] overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1f212d] flex items-center justify-center">
              {activeOshi.image ? (
                <img
                  src={activeOshi.image}
                  alt={activeOshi.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Heart className="w-6 h-6 text-pink-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                {activeOshi.category && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-900/50">
                    {activeOshi.category}
                  </span>
                )}
                <span>{activeOshi.group || '推し'}</span>
                {activeOshi.ruby && <span>({activeOshi.ruby})</span>}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {activeOshi.name}
              </h2>
              {activeOshi.debutDate ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  応援開始から {getDaysSince(activeOshi.debutDate)} 日目
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  推し活応援中
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEventModal()}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#202230] text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>予定追加</span>
            </button>
            <button
              onClick={onOpenGoodsModal}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#202230] text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-gray-500" />
              <span>グッズ登録</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161822] rounded-xl p-5 border border-gray-200 dark:border-[#262838] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              全推しダッシュボード
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              登録中の推し {oshis.length} 人の情報をまとめて表示中
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEventModal()}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#202230] text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>予定追加</span>
            </button>
            <button
              onClick={onOpenGoodsModal}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#202230] text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-gray-500" />
              <span>グッズ登録</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#161822] rounded-xl p-4 border border-gray-200 dark:border-[#262838]">
          <p className="text-xs text-gray-500 dark:text-gray-400">登録中の推し</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {oshis.length} <span className="text-xs font-normal text-gray-400">人</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#161822] rounded-xl p-4 border border-gray-200 dark:border-[#262838]">
          <p className="text-xs text-gray-500 dark:text-gray-400">今月の予定</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {thisMonthEventsCount} <span className="text-xs font-normal text-gray-400">件</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#161822] rounded-xl p-4 border border-gray-200 dark:border-[#262838]">
          <p className="text-xs text-gray-500 dark:text-gray-400">登録グッズ数</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalGoodsCount} <span className="text-xs font-normal text-gray-400">点</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#161822] rounded-xl p-4 border border-gray-200 dark:border-[#262838]">
          <p className="text-xs text-gray-500 dark:text-gray-400">グッズ総額</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(totalGoodsSpent)}
          </p>
        </div>
      </div>

      {/* Today's Events (If any) */}
      {todayEvents.length > 0 && (
        <div className="bg-white dark:bg-[#161822] border-l-4 border-pink-500 rounded-xl p-4 border border-gray-200 dark:border-[#262838]">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center justify-between">
            <span>本日の予定（{todayEvents.length}件）</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold animate-pulse">
              TODAY
            </span>
          </h3>
          <div className="space-y-2">
            {todayEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="p-3 rounded-lg border border-gray-200 dark:border-[#262838] hover:bg-gray-50 dark:hover:bg-[#1d202d] cursor-pointer transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <EventCategoryBadge category={ev.category} />
                    {ev.time && <span className="text-xs text-gray-500 dark:text-gray-400">{ev.time}</span>}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{ev.title}</h4>
                  {ev.location && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
                      <span>{ev.location}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CountdownBadge date={ev.date} size="sm" />
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Upcoming Events & Recent Goods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events Card */}
        <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262838] mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span>直近の予定</span>
              </h3>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>カレンダーへ</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <p>今後の予定はありません</p>
                <button
                  onClick={() => onOpenEventModal()}
                  className="mt-2 text-pink-600 dark:text-pink-400 font-semibold hover:underline"
                >
                  予定を追加する
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Highlight Next Event Countdown Banner */}
                {upcomingEvents[0] && (
                  <div
                    onClick={() => onSelectEvent(upcomingEvents[0])}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-purple-500/10 dark:from-pink-950/40 dark:via-rose-950/30 dark:to-purple-950/40 border border-pink-200/90 dark:border-pink-900/60 flex items-center justify-between gap-3 cursor-pointer hover:border-pink-400 dark:hover:border-pink-500 transition group shadow-2xs mb-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 tracking-wider uppercase">
                          NEXT EVENT（次のイベント）
                        </span>
                        <EventCategoryBadge category={upcomingEvents[0].category} />
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                        {upcomingEvents[0].title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {formatJapaneseDate(upcomingEvents[0].date)}
                        </span>
                        {upcomingEvents[0].time && <span>{upcomingEvents[0].time}</span>}
                        {upcomingEvents[0].location && (
                          <span className="flex items-center gap-1 text-gray-400 truncate">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            {upcomingEvents[0].location}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <CountdownBadge date={upcomingEvents[0].date} size="lg" />
                    </div>
                  </div>
                )}

                {/* Event list (2件目以降の予定) */}
                {upcomingEvents.slice(1).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="p-3 rounded-lg border border-gray-100 dark:border-[#222434] hover:border-gray-200 dark:hover:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#1a1c28] cursor-pointer transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {formatJapaneseDate(ev.date)}
                        </span>
                        {ev.time && <span className="text-xs text-gray-400">{ev.time}</span>}
                        <EventCategoryBadge category={ev.category} />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {ev.title}
                      </h4>
                      {ev.location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{ev.location}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CountdownBadge date={ev.date} size="md" />
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Goods Card */}
        <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262838] mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-pink-500" />
                <span>最近登録したグッズ</span>
              </h3>
              <button
                onClick={() => onNavigateTab('goods')}
                className="text-xs text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>グッズ管理へ</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {recentGoods.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <p>登録されたグッズはありません</p>
                <button
                  onClick={onOpenGoodsModal}
                  className="mt-2 text-pink-600 dark:text-pink-400 font-semibold hover:underline"
                >
                  グッズを登録する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentGoods.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectGoods(item)}
                    className="p-3 rounded-lg border border-gray-100 dark:border-[#222434] hover:border-gray-200 dark:hover:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#1a1c28] cursor-pointer transition flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-[#202230] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-xs truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                        {formatCurrency(item.price)}
                      </p>
                      {item.storageLocation && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          保管場所: {item.storageLocation}
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
