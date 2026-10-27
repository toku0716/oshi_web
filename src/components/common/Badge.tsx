import React from 'react';
import type { EventCategory, GoodsCategory, GoodsOpenStatus, TicketStatus } from '../../types';
import { getDaysDiff } from '../../utils/helpers';

export const EVENT_CATEGORY_CONFIG: Record<EventCategory, { label: string }> = {
  live: { label: 'ライブ・現場' },
  event: { label: 'イベント・ファンミ' },
  broadcast: { label: '配信・番組出演' },
  release: { label: '発売日・記念日' },
  ticket: { label: '当落・入金・発券' },
  other: { label: 'その他' },
};

export const GOODS_CATEGORY_CONFIG: Record<GoodsCategory, { label: string }> = {
  acrylic: { label: 'アクスタ・アクキー' },
  photo: { label: '生写真・チェキ・トレカ' },
  fan: { label: 'うちわ・ボード' },
  penlight: { label: 'ペンライト' },
  apparel: { label: 'タオル・アパレル' },
  media: { label: 'CD・円盤・書籍' },
  badge: { label: '缶バッジ・ピンズ' },
  plush: { label: 'ぬいぐるみ' },
  other: { label: 'その他グッズ' },
};

export const GOODS_STATUS_CONFIG: Record<GoodsOpenStatus, { label: string }> = {
  display: { label: '展示中' },
  opened: { label: '開封済' },
  unopened: { label: '未開封' },
  storage: { label: '保管用' },
};

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; badgeClass: string }> = {
  none: { label: 'チケット不要', badgeClass: 'badge' },
  applied: { label: '当落待ち', badgeClass: 'badge badge-warning' },
  won: { label: '当選（未入金・未発券）', badgeClass: 'badge badge-danger' },
  purchased: { label: '発券済・参戦確定', badgeClass: 'badge badge-success' },
  lost: { label: '落選', badgeClass: 'badge' },
};

export const EventCategoryBadge: React.FC<{ category: EventCategory }> = ({ category }) => {
  const conf = EVENT_CATEGORY_CONFIG[category] || EVENT_CATEGORY_CONFIG.other;
  return <span className="badge badge-primary">{conf.label}</span>;
};

export const GoodsCategoryBadge: React.FC<{ category: GoodsCategory }> = ({ category }) => {
  const conf = GOODS_CATEGORY_CONFIG[category] || GOODS_CATEGORY_CONFIG.other;
  return <span className="badge">{conf.label}</span>;
};

export const GoodsStatusBadge: React.FC<{ status: GoodsOpenStatus }> = ({ status }) => {
  const conf = GOODS_STATUS_CONFIG[status] || GOODS_STATUS_CONFIG.opened;
  return <span className="badge badge-primary">{conf.label}</span>;
};

export const TicketStatusBadge: React.FC<{ status?: TicketStatus }> = ({ status }) => {
  if (!status || status === 'none') return null;
  const conf = TICKET_STATUS_CONFIG[status];
  return <span className={conf.badgeClass}>{conf.label}</span>;
};

export const CountdownBadge: React.FC<{ date: string; size?: 'sm' | 'md' | 'lg' }> = ({
  date,
}) => {
  const daysDiff = getDaysDiff(date);

  if (daysDiff === 0) {
    return <span className="badge badge-danger">本日開催</span>;
  }
  if (daysDiff === 1) {
    return <span className="badge badge-warning">明日開催</span>;
  }
  if (daysDiff > 1) {
    return <span className="badge badge-primary">あと{daysDiff}日</span>;
  }
  return <span className="badge">終了</span>;
};
