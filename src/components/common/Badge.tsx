import React from 'react';
import type { EventCategory, GoodsCategory, GoodsOpenStatus, TicketStatus } from '../../types';

export const EVENT_CATEGORY_CONFIG: Record<EventCategory, { label: string; bg: string; text: string }> = {
  live: { label: 'ライブ', bg: 'bg-rose-100', text: 'text-rose-700' },
  event: { label: 'イベント', bg: 'bg-purple-100', text: 'text-purple-700' },
  broadcast: { label: 'テレビ/配信', bg: 'bg-sky-100', text: 'text-sky-700' },
  release: { label: 'CD/発売日', bg: 'bg-amber-100', text: 'text-amber-700' },
  ticket: { label: 'チケット', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  other: { label: 'その他', bg: 'bg-gray-100', text: 'text-gray-700' },
};

export const GOODS_CATEGORY_CONFIG: Record<GoodsCategory, { label: string; icon: string }> = {
  acrylic: { label: 'アクスタ・キーホルダー', icon: '✨' },
  photo: { label: '生写真・チェキ', icon: '📸' },
  fan: { label: 'うちわ', icon: '🪭' },
  penlight: { label: 'ペンライト', icon: '🪄' },
  apparel: { label: 'アパレル・タオル', icon: '👕' },
  media: { label: 'CD・DVD・Blu-ray', icon: '💿' },
  badge: { label: '缶バッジ', icon: '📛' },
  plush: { label: 'ぬいぐるみ・ぬい服', icon: '🧸' },
  other: { label: 'その他グッズ', icon: '🎁' },
};

export const GOODS_STATUS_CONFIG: Record<GoodsOpenStatus, { label: string; bg: string; text: string }> = {
  unopened: { label: '未開封', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  opened: { label: '開封済', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  display: { label: '展示中', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  storage: { label: '保管用', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
};

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  none: { label: '一般/参加', bg: 'bg-gray-100', text: 'text-gray-600' },
  applied: { label: '抽選応募中', bg: 'bg-amber-100', text: 'text-amber-800' },
  won: { label: '当選済', bg: 'bg-rose-100 font-bold', text: 'text-rose-700' },
  lost: { label: '落選', bg: 'bg-gray-100 line-through', text: 'text-gray-500' },
  purchased: { label: '発券/購入済', bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

export const EventCategoryBadge: React.FC<{ category: EventCategory }> = ({ category }) => {
  const conf = EVENT_CATEGORY_CONFIG[category] || EVENT_CATEGORY_CONFIG.other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${conf.bg} ${conf.text}`}>
      {conf.label}
    </span>
  );
};

export const GoodsCategoryBadge: React.FC<{ category: GoodsCategory }> = ({ category }) => {
  const conf = GOODS_CATEGORY_CONFIG[category] || GOODS_CATEGORY_CONFIG.other;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
      <span>{conf.icon}</span>
      <span>{conf.label}</span>
    </span>
  );
};

export const GoodsStatusBadge: React.FC<{ status: GoodsOpenStatus }> = ({ status }) => {
  const conf = GOODS_STATUS_CONFIG[status] || GOODS_STATUS_CONFIG.opened;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${conf.bg} ${conf.text}`}>
      {conf.label}
    </span>
  );
};

export const TicketStatusBadge: React.FC<{ status?: TicketStatus }> = ({ status }) => {
  if (!status || status === 'none') return null;
  const conf = TICKET_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${conf.bg} ${conf.text}`}>
      {conf.label}
    </span>
  );
};
