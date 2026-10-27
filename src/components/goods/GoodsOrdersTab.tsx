import React, { useState, useMemo } from 'react';
import {
  Clock,
  Heart,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { GoodsCard } from './GoodsCard';
import type { Goods, Oshi } from '../../types';

interface GoodsOrdersTabProps {
  goods: Goods[];
  oshis: Oshi[];
  selectedItem: Goods | null;
  onSelectItem: (item: Goods) => void;
  onToggleFavorite: (e: React.MouseEvent, item: Goods) => void;
  onMoveToOwned: (item: Goods) => void;
  onOpenAddGoods: (isWish: boolean) => void;
  themeColor?: string;
}

export const GoodsOrdersTab: React.FC<GoodsOrdersTabProps> = ({
  goods,
  oshis,
  selectedItem,
  onSelectItem,
  onToggleFavorite,
  onMoveToOwned,
  onOpenAddGoods,
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'preorder' | 'wish'>('preorder');

  const preorders = useMemo(() => goods.filter((g) => g.isPreorder), [goods]);
  const wishItems = useMemo(
    () => goods.filter((g) => g.isWish && !g.isPreorder),
    [goods]
  );

  const currentList = activeSubSection === 'preorder' ? preorders : wishItems;

  const totalPreorderPrice = preorders.reduce((sum, g) => sum + (g.price || 0), 0);
  const totalWishPrice = wishItems.reduce((sum, g) => sum + (g.price || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* サブセクション切り替え */}
      <div
        role="tablist"
        aria-label="予約・欲しいもの切り替え"
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-subtle)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          gap: 4,
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSubSection === 'preorder'}
          onClick={() => setActiveSubSection('preorder')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 0',
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: activeSubSection === 'preorder' ? 800 : 600,
            backgroundColor: activeSubSection === 'preorder' ? 'var(--bg-surface)' : 'transparent',
            color: activeSubSection === 'preorder' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeSubSection === 'preorder' ? 'var(--shadow-card)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Clock size={14} color={activeSubSection === 'preorder' ? '#8B5CF6' : undefined} />
          <span>予約・注文中 ({preorders.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubSection === 'wish'}
          onClick={() => setActiveSubSection('wish')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 0',
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: activeSubSection === 'wish' ? 800 : 600,
            backgroundColor: activeSubSection === 'wish' ? 'var(--bg-surface)' : 'transparent',
            color: activeSubSection === 'wish' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeSubSection === 'wish' ? 'var(--shadow-card)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Heart size={14} color={activeSubSection === 'wish' ? '#EC4899' : undefined} />
          <span>欲しいもの ({wishItems.length})</span>
        </button>
      </div>

      {/* 予算・進捗サマリーカード */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
            {activeSubSection === 'preorder' ? '未受取の予約・注文総額' : '欲しいものの予算目安総額'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
              ¥{(activeSubSection === 'preorder' ? totalPreorderPrice : totalWishPrice).toLocaleString()}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              （{currentList.length} 件）
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddGoods(activeSubSection === 'wish')}
          className="btn-primary"
          style={{
            height: 36,
            padding: '0 14px',
            fontSize: 12.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Plus size={15} />
          <span>{activeSubSection === 'preorder' ? '予約を追加' : '欲しいものを追加'}</span>
        </button>
      </div>

      {/* リスト表示 */}
      {currentList.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 18,
            border: '1px solid var(--border-subtle)',
            padding: '48px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: 'var(--bg-surface-subtle)',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            {activeSubSection === 'preorder' ? <Clock size={24} /> : <ShoppingBag size={24} />}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {activeSubSection === 'preorder'
              ? '現在予約・注文中のグッズはありません'
              : '欲しいものリストは空です'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {activeSubSection === 'preorder'
              ? '通販や店舗で予約したグッズを登録しておくと、届いた時にワンタップで所持へ移動できます'
              : '次に買いたいグッズや検討中のアイテムをメモしておきましょう'}
          </p>
          <button
            type="button"
            onClick={() => onOpenAddGoods(activeSubSection === 'wish')}
            className="btn-primary"
            style={{
              marginTop: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontSize: 13,
            }}
          >
            <Plus size={15} />
            <span>{activeSubSection === 'preorder' ? '予約グッズを登録' : '欲しいものを登録'}</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12,
          }}
        >
          {currentList.map((item) => {
            const oshi = oshis.find((o) => o.id === item.oshiId);
            return (
              <GoodsCard
                key={item.id}
                item={item}
                oshiName={oshi?.name}
                oshiColor={oshi?.color}
                isSelected={selectedItem?.id === item.id}
                viewMode="grid"
                onClick={() => onSelectItem(item)}
                onToggleFavorite={onToggleFavorite}
                onMoveToOwned={onMoveToOwned}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
