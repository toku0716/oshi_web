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
  themeColor = '#FF2D55',
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

  // 予約・欲しいものが0件の時はクリーンな案内のみ表示
  if (preorders.length === 0 && wishItems.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 20,
          border: '1px solid var(--border-subtle)',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: `${themeColor}18`,
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColor,
          }}
        >
          <Clock size={28} />
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 800,
            margin: '0 0 6px',
            color: 'var(--text-primary)',
          }}
        >
          予約中や欲しいグッズはまだありません
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}
        >
          これから発売される予約グッズや欲しいものをリストアップしてみましょう
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onOpenAddGoods(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 20px',
              borderRadius: 14,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${themeColor}44`,
            }}
          >
            <Clock size={16} />
            <span>予約グッズを登録</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAddGoods(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 20px',
              borderRadius: 14,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-primary)',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Heart size={16} color="#EC4899" />
            <span>欲しいものを登録</span>
          </button>
        </div>
      </div>
    );
  }

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
              ? '通販や店舗で予約したグッズを登録しておくと、届いた時にワンタップでコレクションへ移動できます'
              : '次に買いたいグッズや検討中のアイテムをメモしておきましょう'}
          </p>
          <button
            type="button"
            onClick={() => onOpenAddGoods(activeSubSection === 'wish')}
            style={{
              marginTop: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 800,
              backgroundColor: themeColor,
              color: '#FFFFFF',
              borderRadius: 9999,
              border: 'none',
              boxShadow: `0 4px 12px ${themeColor}44`,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            <span>{activeSubSection === 'preorder' ? '予約グッズを登録' : '欲しいものを登録'}</span>
          </button>
        </div>
      ) : (
        <>
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

          {/* リスト末尾の追加ボタン */}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => onOpenAddGoods(activeSubSection === 'wish')}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 14,
                border: '1.5px dashed var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={15} strokeWidth={2.4} />
              <span>{activeSubSection === 'preorder' ? '新しい予約グッズを追加する' : '新しい欲しいものを追加する'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
