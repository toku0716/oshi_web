import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Grid,
  List,
  Package,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react';
import { GoodsCard } from './GoodsCard';
import {
  GOODS_CATEGORY_META,
  type Goods,
  type GoodsCategory,
  type Oshi,
} from '../../types';

interface GoodsGalleryTabProps {
  goods: Goods[];
  oshis: Oshi[];
  selectedItem: Goods | null;
  onSelectItem: (item: Goods) => void;
  onToggleFavorite: (e: React.MouseEvent, item: Goods) => void;
  onUpdateQuantity: (e: React.MouseEvent, item: Goods, delta: number) => void;
  onOpenAddGoods: () => void;
  themeColor: string;
}

type SortOption = 'newest' | 'oldest' | 'price-desc' | 'price-asc' | 'name';

export const GoodsGalleryTab: React.FC<GoodsGalleryTabProps> = ({
  goods,
  oshis,
  selectedItem,
  onSelectItem,
  onToggleFavorite,
  onUpdateQuantity,
  onOpenAddGoods,
  themeColor,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFavorite, setOnlyFavorite] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 所持グッズのみ対象
  const ownedGoods = useMemo(
    () => goods.filter((g) => !g.isWish && !g.isPreorder),
    [goods]
  );

  const filteredGoods = useMemo(() => {
    const list = ownedGoods.filter((g) => {
      if (onlyFavorite && !g.isFavorite) return false;
      if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = g.name.toLowerCase().includes(q);
        const matchesLocation = g.storageLocation?.toLowerCase().includes(q);
        const matchesMemo = g.memo?.toLowerCase().includes(q);
        if (!matchesName && !matchesLocation && !matchesMemo) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      switch (sortBy) {
        case 'newest':
          return (b.createdAt || b.purchaseDate || '').localeCompare(a.createdAt || a.purchaseDate || '');
        case 'oldest':
          return (a.createdAt || a.purchaseDate || '').localeCompare(b.createdAt || b.purchaseDate || '');
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'name':
          return a.name.localeCompare(b.name, 'ja');
        default:
          return 0;
      }
    });
  }, [ownedGoods, onlyFavorite, selectedCategory, searchQuery, sortBy]);

  const totalCount = filteredGoods.reduce((sum, g) => sum + (g.quantity || 1), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 検索・ソート・表示切り替えコントロールバー */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* 検索インプット */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 11, top: 12, color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="グッズ名、保管場所、メモで検索..."
              style={{ width: '100%', paddingLeft: 34, height: 38, fontSize: 13 }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="検索ワードをクリア"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 9,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* お気に入り絞り込み */}
          <button
            type="button"
            onClick={() => setOnlyFavorite((prev) => !prev)}
            aria-pressed={onlyFavorite}
            aria-label="お気に入りのみ表示"
            title="お気に入りのみ表示"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: `1.5px solid ${onlyFavorite ? '#F59E0B' : 'var(--border-subtle)'}`,
              backgroundColor: onlyFavorite ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
              color: onlyFavorite ? '#F59E0B' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Star size={17} fill={onlyFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* ソートセレクター */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="並び替え順"
              style={{
                height: 38,
                padding: '0 26px 0 10px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="newest">新しい順</option>
              <option value="oldest">古い順</option>
              <option value="price-desc">価格が高い順</option>
              <option value="price-asc">価格が安い順</option>
              <option value="name">五十音順</option>
            </select>
            <ArrowUpDown
              size={12}
              style={{
                position: 'absolute',
                right: 8,
                top: 13,
                pointerEvents: 'none',
                color: 'var(--text-secondary)',
              }}
            />
          </div>

          {/* グリッド/リスト表示切り替え */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              padding: 2,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="グリッド表示"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                backgroundColor: viewMode === 'grid' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'grid' ? themeColor : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="リスト表示"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                backgroundColor: viewMode === 'list' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'list' ? themeColor : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* カテゴリピルバー */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '4px 11px',
              borderRadius: 18,
              fontSize: 11.5,
              fontWeight: selectedCategory === 'all' ? 800 : 500,
              backgroundColor: selectedCategory === 'all' ? 'var(--text-primary)' : 'var(--bg-surface)',
              color: selectedCategory === 'all' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            すべて ({ownedGoods.length})
          </button>
          {(Object.keys(GOODS_CATEGORY_META) as GoodsCategory[]).map((cat) => {
            const isSel = selectedCategory === cat;
            const count = ownedGoods.filter((g) => g.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 11px',
                  borderRadius: 18,
                  fontSize: 11.5,
                  fontWeight: isSel ? 800 : 500,
                  backgroundColor: isSel ? 'var(--text-primary)' : 'var(--bg-surface)',
                  color: isSel ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                {GOODS_CATEGORY_META[cat].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 件数表示 */}
      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
        表示中: {filteredGoods.length} 種 ({totalCount} 点)
      </div>

      {/* グッズ一覧（グリッドまたはリスト） */}
      {filteredGoods.length === 0 ? (
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
            <Package size={24} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            該当するグッズがありません
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {searchQuery || selectedCategory !== 'all' || onlyFavorite
              ? '検索条件やフィルターを変更してみてください'
              : '手元にある推しのグッズを登録してみましょう'}
          </p>
          {!searchQuery && selectedCategory === 'all' && !onlyFavorite && (
            <button
              type="button"
              onClick={onOpenAddGoods}
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
              <span>グッズを登録する</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 12,
              }}
            >
              {filteredGoods.map((item) => {
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
                    onUpdateQuantity={onUpdateQuantity}
                  />
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredGoods.map((item) => {
                const oshi = oshis.find((o) => o.id === item.oshiId);
                return (
                  <GoodsCard
                    key={item.id}
                    item={item}
                    oshiName={oshi?.name}
                    oshiColor={oshi?.color}
                    isSelected={selectedItem?.id === item.id}
                    viewMode="list"
                    onClick={() => onSelectItem(item)}
                    onToggleFavorite={onToggleFavorite}
                    onUpdateQuantity={onUpdateQuantity}
                  />
                );
              })}
            </div>
          )}

          {/* リスト末尾の追加ボタン */}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={onOpenAddGoods}
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
              <span>新しいグッズを追加する</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
