import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Goods, GoodsCategory, GoodsOpenStatus } from '../types';
import {
  GOODS_CATEGORY_CONFIG,
  GOODS_STATUS_CONFIG,
  GoodsCategoryBadge,
  GoodsStatusBadge,
} from '../components/common/Badge';
import { formatCurrency } from '../utils/helpers';
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  Heart,
  MapPin,
  X,
} from 'lucide-react';

interface GoodsViewProps {
  onOpenGoodsModal: (targetGoods?: Goods) => void;
  onSelectGoods: (goods: Goods) => void;
}

export const GoodsView: React.FC<GoodsViewProps> = ({
  onOpenGoodsModal,
  onSelectGoods,
}) => {
  const { oshis, goods, activeOshiId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GoodsCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<GoodsOpenStatus | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price-desc' | 'price-asc' | 'date-desc'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter logic
  const filteredGoods = useMemo(() => {
    return goods.filter((item) => {
      if (activeOshiId !== 'all' && item.oshiId !== activeOshiId) {
        return false;
      }
      if (onlyFavorites && !item.isFavorite) {
        return false;
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && item.openStatus !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesMemo = item.memo ? item.memo.toLowerCase().includes(q) : false;
        const matchesLocation = item.storageLocation ? item.storageLocation.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesMemo && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [goods, activeOshiId, onlyFavorites, selectedCategory, selectedStatus, searchQuery]);

  // Sort logic
  const sortedGoods = useMemo(() => {
    return [...filteredGoods].sort((a, b) => {
      if (sortBy === 'price-desc') {
        return (b.price * (b.quantity || 1)) - (a.price * (a.quantity || 1));
      }
      if (sortBy === 'price-asc') {
        return (a.price * (a.quantity || 1)) - (b.price * (b.quantity || 1));
      }
      if (sortBy === 'date-desc') {
        return (b.purchaseDate || '').localeCompare(a.purchaseDate || '');
      }
      return (b.purchaseDate || b.createdAt).localeCompare(a.purchaseDate || a.createdAt);
    });
  }, [filteredGoods, sortBy]);

  // Summary of filtered results
  const totalSpent = useMemo(() => {
    return sortedGoods.reduce((sum, g) => sum + (g.price || 0) * (g.quantity || 1), 0);
  }, [sortedGoods]);

  const totalItemsCount = useMemo(() => {
    return sortedGoods.reduce((sum, g) => sum + (g.quantity || 1), 0);
  }, [sortedGoods]);

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || onlyFavorites;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setOnlyFavorites(false);
  };

  return (
    <div className="space-y-4 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Header & Quick Summary */}
      <div className="bento-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white flex items-center gap-2">
            <span>グッズ管理</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400 num-tabular">
              {goods.length}点
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            コレクション一覧と購入金額まとめ
          </p>
        </div>

        <button
          onClick={() => onOpenGoodsModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs shadow-xs active:scale-95 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>グッズを登録</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card rounded-xl p-3.5 sm:p-4 space-y-3">
        {/* Search & View toggles */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="品名、保管場所、メモ等で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[var(--border-muted)] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="recent">登録が新しい順</option>
              <option value="date-desc">購入日が新しい順</option>
              <option value="price-desc">金額が高い順</option>
              <option value="price-asc">金額が安い順</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-black/[0.03] dark:bg-white/[0.05] rounded-xl p-1 border border-[var(--border-subtle)]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs' : 'text-neutral-400 hover:text-neutral-600'
                }`}
                title="グリッド表示"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs' : 'text-neutral-400 hover:text-neutral-600'
                }`}
                title="リスト表示"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 border ${
              onlyFavorites
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-black/[0.02] dark:bg-white/[0.03] border-[var(--border-subtle)] text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05]'
            }`}
          >
            <Heart className={`w-3 h-3 ${onlyFavorites ? 'fill-rose-500' : ''}`} />
            <span>お気に入り</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-2.5 py-1 text-xs font-medium rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">すべてのカテゴリ</option>
            {(Object.keys(GOODS_CATEGORY_CONFIG) as GoodsCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {GOODS_CATEGORY_CONFIG[cat].icon} {GOODS_CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-2.5 py-1 text-xs font-medium rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">すべての状態</option>
            {(Object.keys(GOODS_STATUS_CONFIG) as GoodsOpenStatus[]).map((st) => (
              <option key={st} value={st}>
                {GOODS_STATUS_CONFIG[st].label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 ml-auto flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>解除</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-neutral-500 dark:text-neutral-400 num-tabular font-medium">
        <span>表示中: <strong className="text-neutral-900 dark:text-white">{sortedGoods.length}</strong> 種類 ({totalItemsCount}点)</span>
        <span>購入総額: <strong className="text-neutral-950 dark:text-white font-bold">{formatCurrency(totalSpent)}</strong></span>
      </div>

      {/* Goods Collection Output */}
      {sortedGoods.length === 0 ? (
        <div className="bento-card rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2 stroke-1" />
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
            該当するグッズがありません
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            {hasActiveFilters ? '検索・絞り込み条件に一致するグッズがありません。' : '登録されているグッズはありません。最初のグッズを登録してみましょう。'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="px-3.5 py-1.5 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-200 font-semibold text-xs transition"
            >
              条件をリセット
            </button>
          ) : (
            <button
              onClick={() => onOpenGoodsModal()}
              className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>グッズを登録</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {sortedGoods.map((item) => {
            const oshi = oshis.find((o) => o.id === item.oshiId);

            return (
              <div
                key={item.id}
                onClick={() => onSelectGoods(item)}
                className="group bento-card rounded-xl overflow-hidden hover:shadow-md cursor-pointer flex flex-col transition-all"
              >
                {/* Image Aspect ratio container */}
                <div className="aspect-square bg-black/[0.02] dark:bg-white/[0.02] relative overflow-hidden flex items-center justify-center border-b border-[var(--border-subtle)]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-neutral-300 dark:text-neutral-600 stroke-1" />
                  )}

                  {/* Favorite badge */}
                  {item.isFavorite && (
                    <span className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 border border-black/5 dark:border-white/10 shadow-xs text-rose-500">
                      <Heart className="w-3 h-3 fill-current" />
                    </span>
                  )}

                  {/* Status chip */}
                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-900/90 border border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-200">
                    {GOODS_STATUS_CONFIG[item.openStatus]?.label || '所持'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    {oshi && (
                      <p
                        className="text-[10px] font-semibold truncate mb-0.5"
                        style={{ color: oshi.color }}
                      >
                        {oshi.name}
                      </p>
                    )}
                    <h3 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-baseline justify-between num-tabular">
                    <span className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-white">
                      {formatCurrency(item.price)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        ×{item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bento-card rounded-xl divide-y divide-[var(--border-subtle)] overflow-hidden">
          {sortedGoods.map((item) => {
            const oshi = oshis.find((o) => o.id === item.oshiId);

            return (
              <div
                key={item.id}
                onClick={() => onSelectGoods(item)}
                className="p-3 sm:p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-neutral-400 stroke-1" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <GoodsCategoryBadge category={item.category} />
                      <GoodsStatusBadge status={item.openStatus} />
                      {oshi && (
                        <span className="text-[11px] font-semibold truncate" style={{ color: oshi.color }}>
                          {oshi.name}
                        </span>
                      )}
                      {item.isFavorite && (
                        <Heart className="w-3 h-3 text-rose-500 fill-current" />
                      )}
                    </div>

                    <h3 className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {item.name}
                    </h3>

                    {item.storageLocation && (
                      <p className="text-[10px] text-neutral-400 flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span>{item.storageLocation}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 num-tabular">
                  <p className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-white">
                    {formatCurrency(item.price)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-[10px] text-neutral-400">×{item.quantity}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
