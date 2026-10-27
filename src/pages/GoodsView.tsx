import React, { useState, useRef, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  MapPin,
  Star,
  ArrowUpDown,
  CheckCircle2,
  X,
  PieChart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { goodsRepository } from '../repository';
import {
  GOODS_CATEGORY_META,
  GOODS_OPEN_STATUS_META,
  type Goods,
  type GoodsCategory,
} from '../types';
import { pressable } from '../utils/a11y';
import { resizeAndConvertImageToBase64 } from '../utils/oshiUtils';
import { useDialog } from '../hooks/useDialog';

interface GoodsViewProps {
  onOpenAddGoods: (isWish: boolean) => void;
  onOpenEditGoods: (goods: Goods) => void;
}

type SortOption = 'newest' | 'oldest' | 'price-desc' | 'price-asc' | 'name';

export const GoodsView: React.FC<GoodsViewProps> = ({
  onOpenAddGoods,
  onOpenEditGoods,
}) => {
  const { goods, oshis, activeOshiId, themeColor, refreshAllData, showToast } =
    useApp();

  const [activeSubtab, setActiveSubtab] = useState<'owned' | 'preorder' | 'wish'>('owned');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [onlyFavorite, setOnlyFavorite] = useState<boolean>(false);
  const [showStatsDetail, setShowStatsDetail] = useState<boolean>(false);

  // 詳細プレビューモーダル
  const [detailItem, setDetailItem] = useState<Goods | null>(null);
  const detailDialogRef = useDialog<HTMLDivElement>(Boolean(detailItem), () => setDetailItem(null));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetGoodsForImage, setTargetGoodsForImage] = useState<Goods | null>(null);

  // ユニークな保管場所リストを抽出
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    goods.forEach((g) => {
      if (g.storageLocation && g.storageLocation.trim()) {
        set.add(g.storageLocation.trim());
      }
    });
    return Array.from(set).sort();
  }, [goods]);

  const handleGoodsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetGoodsForImage) return;
    try {
      const base64 = await resizeAndConvertImageToBase64(file, 800, 0.85);
      const updated = {
        ...targetGoodsForImage,
        image: base64,
        updatedAt: new Date().toISOString(),
      };
      await goodsRepository.save(updated);
      await refreshAllData();
      if (detailItem?.id === updated.id) setDetailItem(updated);
      showToast('画像を更新しました', 'success');
    } catch {
      showToast('画像の保存に失敗しました', 'error');
    } finally {
      setTargetGoodsForImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateQuantity = async (e: React.MouseEvent, item: Goods, delta: number) => {
    e.stopPropagation();
    const nextQty = (item.quantity || 1) + delta;
    if (nextQty <= 0) return;
    const updated = {
      ...item,
      quantity: nextQty,
      updatedAt: new Date().toISOString(),
    };
    await goodsRepository.save(updated);
    await refreshAllData();
    if (detailItem?.id === item.id) setDetailItem(updated);
  };

  // お気に入り切り替え
  const handleToggleFavorite = async (e: React.MouseEvent, item: Goods) => {
    e.stopPropagation();
    const nextFav = !item.isFavorite;
    const updated = {
      ...item,
      isFavorite: nextFav,
      updatedAt: new Date().toISOString(),
    };
    await goodsRepository.save(updated);
    await refreshAllData();
    if (detailItem?.id === item.id) setDetailItem(updated);
    showToast(nextFav ? 'お気に入りに追加しました' : 'お気に入りから外しました', 'info');
  };

  // 予約中・欲しいもの → 所持へステータス昇格
  const handleMoveToOwned = async (item: Goods) => {
    const wasPreorder = item.isPreorder;
    const updated: Goods = {
      ...item,
      isWish: false,
      isPreorder: false,
      openStatus: 'unopened',
      purchaseDate: item.purchaseDate || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    };
    await goodsRepository.save(updated);
    await refreshAllData();
    if (detailItem?.id === item.id) setDetailItem(updated);
    showToast(
      wasPreorder ? '🎉 手元に届いたグッズとして登録しました！' : '🎉 購入済みのコレクションへ移動しました！',
      'success',
      {
        actionLabel: '元に戻す',
        onAction: async () => {
          await goodsRepository.save(item);
          await refreshAllData();
        },
      }
    );
  };

  // フィルタリング & ソート
  const filteredGoods = useMemo(() => {
    const list = goods.filter((g) => {
      // 推しフィルター
      if (activeOshiId !== 'all' && g.oshiId && g.oshiId !== activeOshiId) {
        return false;
      }

      // サブタブフィルター
      if (activeSubtab === 'owned') {
        if (g.isWish || g.isPreorder) return false;
      } else if (activeSubtab === 'preorder') {
        if (!g.isPreorder) return false;
      } else if (activeSubtab === 'wish') {
        if (!g.isWish || g.isPreorder) return false;
      }

      // お気に入りフィルター
      if (onlyFavorite && !g.isFavorite) {
        return false;
      }

      // カテゴリフィルター
      if (selectedCategory !== 'all' && g.category !== selectedCategory) {
        return false;
      }

      // 保管場所フィルター
      if (selectedLocation !== 'all' && g.storageLocation !== selectedLocation) {
        return false;
      }

      // 検索ワード
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = g.name.toLowerCase().includes(q);
        const matchesLocation = g.storageLocation?.toLowerCase().includes(q);
        const matchesMemo = g.memo?.toLowerCase().includes(q);
        if (!matchesName && !matchesLocation && !matchesMemo) return false;
      }

      return true;
    });

    // ソート処理
    return list.sort((a, b) => {
      // お気に入りは常に優先的に上位
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
  }, [goods, activeOshiId, activeSubtab, onlyFavorite, selectedCategory, selectedLocation, searchQuery, sortBy]);

  // 集計サマリー
  const ownedItems = goods.filter((g) => !g.isWish && !g.isPreorder);
  const ownedTotalCount = ownedItems.reduce((sum, g) => sum + (g.quantity || 1), 0);
  const preorderCount = goods.filter((g) => g.isPreorder).length;
  const wishCount = goods.filter((g) => g.isWish && !g.isPreorder).length;

  const totalOwnedPrice = ownedItems.reduce(
    (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
    0
  );

  // カテゴリ別の所持点数集計
  const categoryStats = useMemo(() => {
    const items = goods.filter((g) => !g.isWish && !g.isPreorder);
    const map: Record<string, { count: number; price: number }> = {};
    items.forEach((g) => {
      const cat = g.category || 'other';
      if (!map[cat]) map[cat] = { count: 0, price: 0 };
      const qty = g.quantity || 1;
      map[cat].count += qty;
      map[cat].price += (g.price || 0) * qty;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [goods]);

  return (
    <div className="page-padding">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGoodsImageUpload}
        style={{ display: 'none' }}
      />

      {/* 画面ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            コレクション
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, margin: 0 }}>
            所持グッズ・保管場所・予約状況の一括管理
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddGoods(activeSubtab === 'wish')}
          className="btn-primary"
          style={{ height: 38, padding: '0 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} strokeWidth={2.6} />
          <span>{activeSubtab === 'wish' ? '欲しいものを追加' : 'グッズを追加'}</span>
        </button>
      </div>

      {/* サブタブ切り替え (所持 / 予約中 / 欲しいもの) */}
      <div
        role="tablist"
        aria-label="コレクションの絞り込み"
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-subtle)',
          padding: 4,
          borderRadius: 12,
          marginBottom: 12,
          border: '1px solid var(--border-subtle)',
          gap: 4,
        }}
      >
        {[
          { key: 'owned', label: `所持グッズ (${ownedTotalCount})` },
          { key: 'preorder', label: `予約・注文中 (${preorderCount})` },
          { key: 'wish', label: `欲しいもの (${wishCount})` },
        ].map((tab) => {
          const selected = activeSubtab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveSubtab(tab.key as any)}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: selected ? 800 : 600,
                backgroundColor: selected ? 'var(--bg-surface)' : 'transparent',
                color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                textAlign: 'center',
                boxShadow: selected ? 'var(--shadow-card)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* サマリー & 分析カード (所持タブ時) */}
      {activeSubtab === 'owned' && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            padding: '14px 16px',
            marginBottom: 14,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                所持コレクション総数・総額
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 2 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
                  ¥{totalOwnedPrice.toLocaleString()}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  （{ownedTotalCount} 点）
                </span>
              </div>
            </div>

            {categoryStats.length > 0 && (
              <button
                type="button"
                onClick={() => setShowStatsDetail((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <PieChart size={13} />
                <span>内訳</span>
                {showStatsDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>

          {/* 内訳詳細の展開アコーディオン */}
          {showStatsDetail && categoryStats.length > 0 && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 8,
              }}
            >
              {categoryStats.map(([cat, stat]) => {
                const label = GOODS_CATEGORY_META[cat as GoodsCategory]?.label || cat;
                return (
                  <div
                    key={cat}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      backgroundColor: 'var(--bg-surface-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {label}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {stat.count}点
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ¥{stat.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 検索・ソート・お気に入りフィルター */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* 検索ボックス */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="グッズ名、保管場所、メモで検索..."
              style={{ width: '100%', paddingLeft: 36, height: 40 }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="検索ワードをクリア"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* お気に入り絞り込みボタン */}
          <button
            type="button"
            onClick={() => setOnlyFavorite((prev) => !prev)}
            aria-pressed={onlyFavorite}
            aria-label="お気に入りのみ表示"
            title="お気に入りのみ表示"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
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
            <Star size={18} fill={onlyFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* ソートセレクター */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="並び替え順"
              style={{
                height: 40,
                padding: '0 28px 0 10px',
                borderRadius: 12,
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
              size={13}
              style={{
                position: 'absolute',
                right: 9,
                top: 13,
                pointerEvents: 'none',
                color: 'var(--text-secondary)',
              }}
            />
          </div>
        </div>

        {/* カテゴリピル */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: selectedCategory === 'all' ? 800 : 500,
              backgroundColor: selectedCategory === 'all' ? 'var(--text-primary)' : 'var(--bg-surface)',
              color: selectedCategory === 'all' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            全カテゴリ
          </button>
          {(Object.keys(GOODS_CATEGORY_META) as GoodsCategory[]).map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isSel ? 800 : 500,
                  backgroundColor: isSel ? 'var(--text-primary)' : 'var(--bg-surface)',
                  color: isSel ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                {GOODS_CATEGORY_META[cat].label}
              </button>
            );
          })}
        </div>

        {/* 保管場所ピル (所持タブで場所が登録されている場合のみ) */}
        {activeSubtab === 'owned' && availableLocations.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} /> 場所:
            </span>
            <button
              type="button"
              onClick={() => setSelectedLocation('all')}
              style={{
                padding: '3px 9px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: selectedLocation === 'all' ? 700 : 500,
                backgroundColor: selectedLocation === 'all' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: selectedLocation === 'all' ? themeColor : 'var(--text-secondary)',
                border: `1px solid ${selectedLocation === 'all' ? themeColor : 'var(--border-subtle)'}`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              すべて
            </button>
            {availableLocations.map((loc) => {
              const isSel = selectedLocation === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedLocation(loc)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: isSel ? 700 : 500,
                    backgroundColor: isSel ? `${themeColor}18` : 'transparent',
                    color: isSel ? themeColor : 'var(--text-secondary)',
                    border: `1px solid ${isSel ? themeColor : 'var(--border-subtle)'}`,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* グッズ一覧グリッド */}
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
          <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'var(--bg-surface-subtle)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Package size={24} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all' || onlyFavorite
              ? '条件に一致するグッズが見つかりません'
              : activeSubtab === 'wish'
              ? '欲しいものリストは空です'
              : activeSubtab === 'preorder'
              ? '予約・注文中のアイテムはありません'
              : '所持グッズはまだ登録されていません'}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 16 }}>
            {activeSubtab === 'wish'
              ? '気になるグッズやアクスタを登録してメモしておきましょう'
              : '右上のボタンから最初のコレクションを追加できます'}
          </p>
          <button
            type="button"
            onClick={() => onOpenAddGoods(activeSubtab === 'wish')}
            className="btn-primary"
            style={{ fontSize: 13, padding: '8px 18px' }}
          >
            ＋ アイテムを登録
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {filteredGoods.map((item) => {
            const oshi = oshis.find((o) => o.id === item.oshiId);
            const statusInfo = GOODS_OPEN_STATUS_META[item.openStatus] || GOODS_OPEN_STATUS_META.storage;
            const categoryInfo = GOODS_CATEGORY_META[item.category] || GOODS_CATEGORY_META.other;

            return (
              <div
                key={item.id}
                {...pressable(() => setDetailItem(item))}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 16,
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: 'var(--shadow-card)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
                aria-label={`グッズ: ${item.name}`}
              >
                {/* 写真エリア */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', backgroundColor: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <Package size={34} strokeWidth={1.4} />
                    </div>
                  )}

                  {/* カテゴリバッジ */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 7,
                      left: 7,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(0,0,0,0.68)',
                      color: '#FFFFFF',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {categoryInfo.label}
                  </span>

                  {/* 右上：お気に入りスターボタン */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, item)}
                    aria-label={item.isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: item.isFavorite ? '#F59E0B' : '#FFFFFF',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Star size={15} fill={item.isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  {/* 状態バッジ (左下) */}
                  {!item.isWish && !item.isPreorder && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 7,
                        left: 7,
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 5,
                        backgroundColor: statusInfo.color,
                        color: '#FFFFFF',
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  )}

                  {/* 予約中バッジ */}
                  {item.isPreorder && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 7,
                        left: 7,
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 5,
                        backgroundColor: '#8B5CF6',
                        color: '#FFFFFF',
                      }}
                    >
                      予約済み
                    </span>
                  )}
                </div>

                {/* カード本体 */}
                <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  {oshi && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: oshi.color || themeColor,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {oshi.name}
                    </span>
                  )}

                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: 35,
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </div>

                  {/* 保管場所表示 */}
                  {item.storageLocation && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        marginTop: 2,
                      }}
                    >
                      <MapPin size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.storageLocation}
                      </span>
                    </div>
                  )}

                  {/* フッター：価格 & 数量操作または購入昇格ボタン */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      ¥{(item.price || 0).toLocaleString()}
                    </span>

                    {/* 所持グッズ：数量コントロール */}
                    {!item.isWish && !item.isPreorder && (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQuantity(e, item, -1)}
                          aria-label="数量を減らす"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 5,
                            backgroundColor: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: 'center', color: 'var(--text-primary)' }}>
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQuantity(e, item, 1)}
                          aria-label="数量を増やす"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 5,
                            backgroundColor: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* 欲しいもの・予約中：所持へ昇格ボタン */}
                    {(item.isWish || item.isPreorder) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToOwned(item);
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: item.isPreorder ? '#8B5CF6' : 'var(--oshi-color)',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.isPreorder ? '届いた' : '買った'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* グッズ詳細プレビューモーダル */}
      {detailItem && (
        <div
          className="modal-overlay"
          onClick={() => setDetailItem(null)}
        >
          <div
            ref={detailDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="goods-detail-title"
            className="modal-box"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="goods-detail-title" className="modal-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>
                {detailItem.name}
              </h3>
              <button
                type="button"
                className="btn-sm"
                onClick={() => setDetailItem(null)}
                aria-label="閉じる"
              >
                <X size={15} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px 24px' }}>
              {/* 大判画像エリア */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 16,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: 16,
                }}
              >
                {detailItem.image ? (
                  <img
                    src={detailItem.image}
                    alt={detailItem.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'var(--bg-canvas)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Package size={48} strokeWidth={1.2} />
                    <button
                      type="button"
                      onClick={() => {
                        setTargetGoodsForImage(detailItem);
                        fileInputRef.current?.click();
                      }}
                      className="btn-sm"
                    >
                      写真を追加
                    </button>
                  </div>
                )}
              </div>

              {/* プロパティ一覧 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ステータス</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {detailItem.isWish ? '欲しいもの' : detailItem.isPreorder ? '予約・注文中' : '所持コレクション'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>カテゴリ</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {GOODS_CATEGORY_META[detailItem.category]?.label || 'その他'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>価格</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
                    ¥{(detailItem.price || 0).toLocaleString()}
                  </span>
                </div>

                {!detailItem.isWish && !detailItem.isPreorder && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>所持数</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {detailItem.quantity || 1} 点
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>保存・状態</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: (GOODS_OPEN_STATUS_META[detailItem.openStatus] || GOODS_OPEN_STATUS_META.storage).color,
                        }}
                      >
                        {(GOODS_OPEN_STATUS_META[detailItem.openStatus] || GOODS_OPEN_STATUS_META.storage).label}
                      </span>
                    </div>

                    {detailItem.storageLocation && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>保管場所</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {detailItem.storageLocation}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {detailItem.purchaseDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>登録日・購入日</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {detailItem.purchaseDate.replace(/-/g, '/')}
                    </span>
                  </div>
                )}

                {detailItem.memo && (
                  <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 10, backgroundColor: 'var(--bg-surface-subtle)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                    {detailItem.memo}
                  </div>
                )}
              </div>

              {/* アクションボタン群 */}
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                {(detailItem.isWish || detailItem.isPreorder) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleMoveToOwned(detailItem);
                      setDetailItem(null);
                    }}
                    className="btn-primary"
                    style={{ flex: 1, height: 42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{detailItem.isPreorder ? '届いた（所持へ移動）' : '購入した（所持へ移動）'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const target = detailItem;
                    setDetailItem(null);
                    onOpenEditGoods(target);
                  }}
                  className="btn-sm"
                  style={{ flex: (detailItem.isWish || detailItem.isPreorder) ? 'none' : 1, height: 42, padding: '0 18px', textAlign: 'center', fontWeight: 700 }}
                >
                  編集する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
