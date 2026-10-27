import React, { useState, useRef, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { goodsRepository } from '../repository';
import type { Goods, GoodsCategory, GoodsOpenStatus } from '../types';
import { pressable } from '../utils/a11y';
import { resizeAndConvertImageToBase64 } from '../utils/oshiUtils';

interface GoodsViewProps {
  onOpenAddGoods: (isWish: boolean) => void;
  onOpenEditGoods: (goods: Goods) => void;
}

const CATEGORY_LABELS: Record<GoodsCategory, string> = {
  acrylic: 'アクスタ',
  photo: '生写真・チェキ',
  fan: 'うちわ',
  penlight: 'ペンライト',
  apparel: 'アパレル',
  media: '円盤・書籍',
  badge: '缶バッジ',
  plush: 'ぬいぐるみ',
  other: 'その他グッズ',
};

const OPEN_STATUS_LABELS: Record<GoodsOpenStatus, { label: string; color: string }> = {
  unopened: { label: '未開封', color: '#10B981' },
  opened: { label: '開封済み', color: '#3B82F6' },
  display: { label: '飾っている', color: '#F59E0B' },
  storage: { label: '保管中', color: '#6B7280' },
};

export const GoodsView: React.FC<GoodsViewProps> = ({
  onOpenAddGoods,
  onOpenEditGoods,
}) => {
  const { goods, oshis, activeOshiId, themeColor, refreshAllData, showToast } =
    useApp();

  const [activeSubtab, setActiveSubtab] = useState<'owned' | 'preorder' | 'wish'>('owned');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetGoodsForImage, setTargetGoodsForImage] = useState<Goods | null>(null);

  const handleGoodsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetGoodsForImage) return;
    try {
      const base64 = await resizeAndConvertImageToBase64(file, 800, 0.85);
      await goodsRepository.save({
        ...targetGoodsForImage,
        image: base64,
        updatedAt: new Date().toISOString(),
      });
      await refreshAllData();
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
    await goodsRepository.save({
      ...item,
      quantity: nextQty,
      updatedAt: new Date().toISOString(),
    });
    await refreshAllData();
  };

  // フィルタリング処理
  const filteredGoods = useMemo(() => {
    return goods.filter((g) => {
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

      // カテゴリフィルター
      if (selectedCategory !== 'all' && g.category !== selectedCategory) {
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
  }, [goods, activeOshiId, activeSubtab, selectedCategory, searchQuery]);

  // 集計
  const ownedCount = goods.filter((g) => !g.isWish && !g.isPreorder).reduce((sum, g) => sum + (g.quantity || 1), 0);
  const preorderCount = goods.filter((g) => g.isPreorder).length;
  const wishCount = goods.filter((g) => g.isWish && !g.isPreorder).length;

  const totalOwnedPrice = goods
    .filter((g) => !g.isWish && !g.isPreorder)
    .reduce((sum, g) => sum + (g.price || 0) * (g.quantity || 1), 0);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            コレクション
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            グッズ・所持品・予約中アイテムの管理（重複購入防止・保管場所管理）
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddGoods(activeSubtab === 'wish')}
          className="btn-primary"
          style={{ height: 36, padding: '0 14px', fontSize: 13 }}
        >
          <Plus size={16} />
          <span>{activeSubtab === 'wish' ? '欲しいものを追加' : 'グッズを追加'}</span>
        </button>
      </div>

      {/* サブタブ切り替え */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-subtle)',
          padding: 4,
          borderRadius: 10,
          marginBottom: 14,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubtab('owned')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: activeSubtab === 'owned' ? 700 : 500,
            backgroundColor: activeSubtab === 'owned' ? 'var(--bg-surface)' : 'transparent',
            color: activeSubtab === 'owned' ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center',
            transition: 'background-color 0.15s ease',
          }}
        >
          所持グッズ ({ownedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubtab('preorder')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: activeSubtab === 'preorder' ? 700 : 500,
            backgroundColor: activeSubtab === 'preorder' ? 'var(--bg-surface)' : 'transparent',
            color: activeSubtab === 'preorder' ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center',
            transition: 'background-color 0.15s ease',
          }}
        >
          予約・注文中 ({preorderCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubtab('wish')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: activeSubtab === 'wish' ? 700 : 500,
            backgroundColor: activeSubtab === 'wish' ? 'var(--bg-surface)' : 'transparent',
            color: activeSubtab === 'wish' ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center',
            transition: 'background-color 0.15s ease',
          }}
        >
          欲しいもの ({wishCount})
        </button>
      </div>

      {/* サマリーバー (所持時のみ) */}
      {activeSubtab === 'owned' && (
        <div
          className="clean-card"
          style={{
            padding: '12px 16px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
            所持コレクション総額
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>
            ¥{totalOwnedPrice.toLocaleString()}
          </span>
        </div>
      )}

      {/* 検索 & カテゴリフィルターバー */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="グッズ名、保管場所で検索..."
            style={{ width: '100%', paddingLeft: 36, height: 40 }}
          />
        </div>

        {/* カテゴリピル */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: selectedCategory === 'all' ? 700 : 500,
              backgroundColor: selectedCategory === 'all' ? 'var(--text-primary)' : 'var(--bg-surface)',
              color: selectedCategory === 'all' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            すべて
          </button>
          {(Object.keys(CATEGORY_LABELS) as GoodsCategory[]).map((cat) => {
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
                  fontWeight: isSel ? 700 : 500,
                  backgroundColor: isSel ? 'var(--text-primary)' : 'var(--bg-surface)',
                  color: isSel ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>

      {/* グッズ一覧グリッド */}
      {filteredGoods.length === 0 ? (
        <div className="clean-card" style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
          該当するグッズはありません
        </div>
      ) : (
        <div className="goods-grid">
          {filteredGoods.map((item) => {
            const oshi = oshis.find((o) => o.id === item.oshiId);
            const statusInfo = OPEN_STATUS_LABELS[item.openStatus] || OPEN_STATUS_LABELS.storage;
            return (
              <div
                key={item.id}
                {...pressable(() => onOpenEditGoods(item))}
                className="goods-card"
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
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      <Package size={32} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* カテゴリバッジ */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(0,0,0,0.68)',
                      color: '#FFFFFF',
                    }}
                  >
                    {CATEGORY_LABELS[item.category] || 'グッズ'}
                  </span>

                  {/* 開封・状態バッジ */}
                  {!item.isWish && !item.isPreorder && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 6,
                        backgroundColor: statusInfo.color,
                        color: '#FFFFFF',
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  )}

                  {/* 予約中バッジ（重複購入防止） */}
                  {item.isPreorder && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: '#8B5CF6',
                        color: '#FFFFFF',
                      }}
                    >
                      予約済み
                    </span>
                  )}
                </div>

                {/* カード本体 */}
                <div className="goods-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {oshi && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: oshi.color || themeColor,
                        }}
                      >
                        {oshi.name}
                      </span>
                    )}
                  </div>

                  <div className="goods-card-name" title={item.name}>
                    {item.name}
                  </div>

                  {/* 保管場所の表示（オタクの超実用的機能） */}
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
                      <MapPin size={11} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.storageLocation}
                      </span>
                    </div>
                  )}

                  {/* 価格 & 数量 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="goods-card-price">
                      ¥{(item.price || 0).toLocaleString()}
                    </span>

                    {!item.isWish && !item.isPreorder && (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQuantity(e, item, -1)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            backgroundColor: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQuantity(e, item, 1)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            backgroundColor: 'var(--bg-surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
