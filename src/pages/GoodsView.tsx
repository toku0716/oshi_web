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
  TrendingUp,
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
      // Oshi filter
      if (activeOshiId !== 'all' && item.oshiId !== activeOshiId) {
        return false;
      }
      // Favorite filter
      if (onlyFavorites && !item.isFavorite) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && item.openStatus !== selectedStatus) {
        return false;
      }
      // Search query
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
      // Default: recent
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
    <div className="space-y-6 pb-12">
      {/* Header & Add Button */}
      <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-pink-500" />
            <span>グッズ管理</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            登録した推しグッズと投資額を管理できます。
          </p>
        </div>

        <button
          onClick={() => onOpenGoodsModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>グッズを登録</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-4 sm:p-5 space-y-3">
        {/* Top search & View toggles */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="グッズ名、保管場所、メモから検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
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
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer"
            >
              <option value="recent">登録が新しい順</option>
              <option value="date-desc">購入日が新しい順</option>
              <option value="price-desc">金額が高い順</option>
              <option value="price-asc">金額が安い順</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-pink-600 shadow-xs' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="グリッド表示"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-pink-600 shadow-xs' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="リスト表示"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
              onlyFavorites
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart className={`w-3 h-3 ${onlyFavorites ? 'fill-rose-500' : ''}`} />
            <span>お気に入り</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none"
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
            className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none"
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
              className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 ml-auto flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              条件をリセット
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-pink-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-600" />
          <span className="font-bold text-gray-800">
            表示中: {sortedGoods.length}種類 ({totalItemsCount}点)
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 font-medium mr-1.5">合計投資額:</span>
          <span className="text-lg font-black text-pink-600 tracking-tight">
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      {/* Goods Collection Output */}
      {sortedGoods.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-2 stroke-1" />
          <h3 className="text-base font-bold text-gray-700 mb-1">
            該当するグッズがありません
          </h3>
          <p className="text-xs text-gray-400 mb-5">
            {hasActiveFilters ? '絞り込み条件を変更してみてください。' : '推しのグッズを登録してコレクションを楽しみましょう！'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition"
            >
              検索条件を解除
            </button>
          ) : (
            <button
              onClick={() => onOpenGoodsModal()}
              className="px-5 py-2.5 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 transition shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>グッズを登録する</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {sortedGoods.map((item) => {
            const oshi = oshis.find((o) => o.id === item.oshiId);

            return (
              <div
                key={item.id}
                onClick={() => onSelectGoods(item)}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-pink-200 transition duration-200 cursor-pointer flex flex-col"
              >
                {/* Image Aspect ratio container */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-gray-200 stroke-1" />
                  )}

                  {/* Favorite badge */}
                  {item.isFavorite && (
                    <span className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-xs shadow-xs text-rose-500">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </span>
                  )}

                  {/* Status chip */}
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs shadow-xs text-gray-700">
                    {GOODS_STATUS_CONFIG[item.openStatus]?.label || '所持'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {oshi && (
                      <p
                        className="text-[11px] font-bold truncate mb-1"
                        style={{ color: oshi.color }}
                      >
                        {oshi.name}
                      </p>
                    )}
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-pink-600 transition leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm sm:text-base font-black text-pink-600">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    {item.quantity > 1 && (
                      <span className="text-xs text-gray-400 font-semibold">
                        × {item.quantity}個
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {sortedGoods.map((item) => {
            const oshi = oshis.find((o) => o.id === item.oshiId);

            return (
              <div
                key={item.id}
                onClick={() => onSelectGoods(item)}
                className="p-3.5 sm:p-4 hover:bg-pink-50/20 transition cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300 stroke-1" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <GoodsCategoryBadge category={item.category} />
                      <GoodsStatusBadge status={item.openStatus} />
                      {oshi && (
                        <span className="text-xs font-bold truncate" style={{ color: oshi.color }}>
                          {oshi.name}
                        </span>
                      )}
                      {item.isFavorite && (
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-pink-600 transition">
                      {item.name}
                    </h3>

                    {item.storageLocation && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-pink-500" />
                        {item.storageLocation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm sm:text-base font-black text-pink-600">
                    {formatCurrency(item.price)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-400">×{item.quantity}個</p>
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
