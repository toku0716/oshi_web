import React from 'react';
import type { EventCategory, GoodsCategory, GoodsOpenStatus, TicketStatus } from '../../types';
import { getDaysDiff } from '../../utils/helpers';

export const EVENT_CATEGORY_CONFIG: Record<EventCategory, { label: string; bg: string; text: string; border: string }> = {
  live: { label: 'ライブ', bg: 'bg-rose-500/10 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500/20' },
  event: { label: 'イベント', bg: 'bg-purple-500/10 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500/20' },
  broadcast: { label: 'テレビ/配信', bg: 'bg-sky-500/10 dark:bg-sky-500/15', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-500/20' },
  release: { label: 'CD/発売日', bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500/20' },
  ticket: { label: 'チケット', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/20' },
  other: { label: 'その他', bg: 'bg-neutral-500/10 dark:bg-neutral-500/15', text: 'text-neutral-700 dark:text-neutral-300', border: 'border-neutral-500/20' },
};

export const GOODS_CATEGORY_CONFIG: Record<GoodsCategory, { label: string; icon: string }> = {
  acrylic: { label: 'アクスタ・アクキー', icon: '✨' },
  photo: { label: '生写真・チェキ', icon: '📸' },
  fan: { label: 'うちわ', icon: '🪭' },
  penlight: { label: 'ペンライト', icon: '🪄' },
  apparel: { label: 'アパレル・タオル', icon: '👕' },
  media: { label: 'CD・DVD・Blu-ray', icon: '💿' },
  badge: { label: '缶バッジ', icon: '📛' },
  plush: { label: 'ぬいぐるみ・ぬい服', icon: '🧸' },
  other: { label: 'その他グッズ', icon: '🎁' },
};

export const GOODS_STATUS_CONFIG: Record<GoodsOpenStatus, { label: string; bg: string; text: string; border: string }> = {
  unopened: { label: '未開封', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/20' },
  opened: { label: '開封済', bg: 'bg-blue-500/10 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500/20' },
  display: { label: '展示中', bg: 'bg-purple-500/10 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500/20' },
  storage: { label: '保管用', bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500/20' },
};

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string; border: string }> = {
  none: { label: '一般/参加', bg: 'bg-neutral-500/10', text: 'text-neutral-600 dark:text-neutral-400', border: 'border-neutral-500/20' },
  applied: { label: '抽選応募中', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500/20' },
  won: { label: '当選済', bg: 'bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300 font-semibold', border: 'border-rose-500/30' },
  lost: { label: '落選', bg: 'bg-neutral-500/10', text: 'text-neutral-400 line-through', border: 'border-neutral-500/15' },
  purchased: { label: '発券済', bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300 font-semibold', border: 'border-emerald-500/30' },
};

export const EventCategoryBadge: React.FC<{ category: EventCategory }> = ({ category }) => {
  const conf = EVENT_CATEGORY_CONFIG[category] || EVENT_CATEGORY_CONFIG.other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border tracking-tight ${conf.bg} ${conf.text} ${conf.border}`}>
      {conf.label}
    </span>
  );
};

export const GoodsCategoryBadge: React.FC<{ category: GoodsCategory }> = ({ category }) => {
  const conf = GOODS_CATEGORY_CONFIG[category] || GOODS_CATEGORY_CONFIG.other;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
      <span className="text-xs">{conf.icon}</span>
      <span>{conf.label}</span>
    </span>
  );
};

export const GoodsStatusBadge: React.FC<{ status: GoodsOpenStatus }> = ({ status }) => {
  const conf = GOODS_STATUS_CONFIG[status] || GOODS_STATUS_CONFIG.opened;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border tracking-tight ${conf.bg} ${conf.text} ${conf.border}`}>
      {conf.label}
    </span>
  );
};

export const TicketStatusBadge: React.FC<{ status?: TicketStatus }> = ({ status }) => {
  if (!status || status === 'none') return null;
  const conf = TICKET_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border tracking-tight ${conf.bg} ${conf.text} ${conf.border}`}>
      {conf.label}
    </span>
  );
};

export const CountdownBadge: React.FC<{ date: string; size?: 'sm' | 'md' | 'lg' }> = ({
  date,
  size = 'md',
}) => {
  const daysDiff = getDaysDiff(date);

  if (daysDiff === 0) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold tracking-tight rounded-md bg-rose-600 text-white shadow-xs shrink-0 animate-pulse ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
        }`}
      >
        本日
      </span>
    );
  }

  if (daysDiff === 1) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold tracking-tight rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shrink-0 ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
        }`}
      >
        明日
      </span>
    );
  }

  if (daysDiff > 1 && daysDiff <= 7) {
    return (
      <span
        className={`inline-flex items-center justify-center font-semibold tracking-tight rounded-md bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0 num-tabular ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
        }`}
      >
        D-{daysDiff}
      </span>
    );
  }

  if (daysDiff > 7) {
    return (
      <span
        className={`inline-flex items-center justify-center font-medium tracking-tight rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60 shrink-0 num-tabular ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
        }`}
      >
        あと{daysDiff}日
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-medium tracking-tight rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 shrink-0 ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[10px]'
      }`}
    >
      終了
    </span>
  );
};
