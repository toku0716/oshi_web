import React, { useState, useMemo } from 'react';
import {
  Clock,
  CreditCard,
  MapPin,
  PieChart,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { goodsRepository, expenseRepository } from '../repository';
import type { Goods, ExpenseItem } from '../types';
import { resizeAndConvertImageToBase64 } from '../utils/oshiUtils';
import { useDialog } from '../hooks/useDialog';

// 分割コンポーネント
import { GoodsGalleryTab } from '../components/goods/GoodsGalleryTab';
import { GoodsStorageTab } from '../components/goods/GoodsStorageTab';
import { GoodsOrdersTab } from '../components/goods/GoodsOrdersTab';
import { GoodsExpensesTab } from '../components/goods/GoodsExpensesTab';
import { GoodsAnalyticsTab } from '../components/goods/GoodsAnalyticsTab';
import { GoodsDetailInspector } from '../components/goods/GoodsDetailInspector';

interface GoodsViewProps {
  onOpenAddGoods: (isWish: boolean) => void;
  onOpenEditGoods: (goods: Goods) => void;
  onOpenAddExpense?: () => void;
  onOpenEditExpense?: (expense: ExpenseItem) => void;
}

type MainTab = 'gallery' | 'orders' | 'expenses' | 'storage' | 'analytics';

export const GoodsView: React.FC<GoodsViewProps> = ({
  onOpenAddGoods,
  onOpenEditGoods,
  onOpenAddExpense,
  onOpenEditExpense,
}) => {
  const { goods, expenses, oshis, activeOshiId, themeColor, refreshAllData, showToast } =
    useApp();

  const [activeTab, setActiveTab] = useState<MainTab>('gallery');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);

  // 常に最新のグッズデータをIDから導出（同期用useEffect不要）
  const selectedItem = useMemo(
    () => (selectedItemId ? goods.find((g) => g.id === selectedItemId) || null : null),
    [goods, selectedItemId]
  );

  // モーダルダイアログ制御（アクセシビリティ対応）
  const mobileDialogRef = useDialog<HTMLDivElement>(
    isMobileModalOpen,
    () => setIsMobileModalOpen(false)
  );

  // アクティブ推しでフィルタリングされたグッズ一覧
  const filteredByOshiGoods = useMemo(() => {
    if (activeOshiId === 'all') return goods;
    return goods.filter((g) => !g.oshiId || g.oshiId === activeOshiId);
  }, [goods, activeOshiId]);

  // 各タブのバッジカウント計算
  const ownedCount = useMemo(
    () => filteredByOshiGoods.filter((g) => !g.isWish && !g.isPreorder).length,
    [filteredByOshiGoods]
  );
  const ordersCount = useMemo(
    () => filteredByOshiGoods.filter((g) => g.isPreorder || g.isWish).length,
    [filteredByOshiGoods]
  );
  const storageLocationCount = useMemo(() => {
    const set = new Set<string>();
    filteredByOshiGoods.forEach((g) => {
      if (!g.isWish && !g.isPreorder && g.storageLocation?.trim()) {
        set.add(g.storageLocation.trim());
      }
    });
    return set.size;
  }, [filteredByOshiGoods]);

  // グッズ選択ハンドラ (PCではインスペクターに即座に表示、スマホではモーダルを開く)
  const handleSelectItem = (item: Goods) => {
    setSelectedItemId(item.id);
    if (typeof window !== 'undefined' && window.innerWidth < 960) {
      setIsMobileModalOpen(true);
    }
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
    showToast(nextFav ? '★ お気に入りに追加しました' : 'お気に入りから外しました', 'info');
  };

  // 数量変更
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
  };

  // 予約・欲しいもの → 所持へ昇格
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
    setIsMobileModalOpen(false);

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

  // 画像アップロード
  const handleImageFileSelect = async (item: Goods, file: File) => {
    try {
      const base64 = await resizeAndConvertImageToBase64(file, 800, 0.85);
      const updated = {
        ...item,
        image: base64,
        updatedAt: new Date().toISOString(),
      };
      await goodsRepository.save(updated);
      await refreshAllData();
      showToast('写真を更新しました', 'success');
    } catch {
      showToast('写真の保存に失敗しました', 'error');
    }
  };

  // 削除処理
  const handleDeleteGoods = async (item: Goods) => {
    if (!window.confirm(`「${item.name}」を削除してもよろしいですか？`)) return;
    await goodsRepository.delete(item.id);
    await refreshAllData();
    if (selectedItemId === item.id) setSelectedItemId(null);
    setIsMobileModalOpen(false);
    showToast('グッズを削除しました', 'info');
  };

  // 編集モーダルを開く
  const handleEditGoods = (item: Goods) => {
    setIsMobileModalOpen(false);
    onOpenEditGoods(item);
  };

  return (
    <div className="page-padding">
      {/* 画面ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            グッズ管理
          </h1>
        </div>
      </div>

      {/* 機能分割タブバー (4タブ) */}
      <div
        role="tablist"
        aria-label="グッズ機能タブ"
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-subtle)',
          padding: 4,
          borderRadius: 14,
          marginBottom: 18,
          border: '1px solid var(--border-subtle)',
          gap: 4,
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'gallery', label: '一覧', icon: ShoppingBag, count: ownedCount },
          { key: 'orders', label: '予約・欲しいもの', icon: Clock, count: ordersCount },
          { key: 'expenses', label: '支出記録', icon: CreditCard, count: expenses.length },
          { key: 'storage', label: '保管場所別', icon: MapPin, count: storageLocationCount },
          { key: 'analytics', label: '分析・内訳', icon: PieChart, count: null },
        ].map((tab) => {
          const selected = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.key as MainTab)}
              style={{
                flex: 1,
                minWidth: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 10px',
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: selected ? 800 : 600,
                backgroundColor: selected ? 'var(--bg-surface)' : 'transparent',
                color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: selected ? 'var(--shadow-card)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} color={selected ? themeColor : undefined} strokeWidth={selected ? 2.5 : 2} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 10,
                    backgroundColor: selected ? `${themeColor}20` : 'var(--bg-surface)',
                    color: selected ? themeColor : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2ペイン マスター・ディテール分割レイアウト */}
      <div className="goods-split-layout">
        {/* 左ペイン（メインコンテンツ） */}
        <div className="goods-main-pane">
          {activeTab === 'gallery' && (
            <GoodsGalleryTab
              goods={filteredByOshiGoods}
              oshis={oshis}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              onToggleFavorite={handleToggleFavorite}
              onUpdateQuantity={handleUpdateQuantity}
              onOpenAddGoods={() => onOpenAddGoods(false)}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'storage' && (
            <GoodsStorageTab
              goods={filteredByOshiGoods}
              oshis={oshis}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              onToggleFavorite={handleToggleFavorite}
              onUpdateQuantity={handleUpdateQuantity}
              onOpenAddGoods={() => onOpenAddGoods(false)}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'orders' && (
            <GoodsOrdersTab
              goods={filteredByOshiGoods}
              oshis={oshis}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              onToggleFavorite={handleToggleFavorite}
              onMoveToOwned={handleMoveToOwned}
              onOpenAddGoods={onOpenAddGoods}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'expenses' && (
            <GoodsExpensesTab
              expenses={expenses}
              themeColor={themeColor}
              onOpenAddExpense={onOpenAddExpense || (() => {})}
              onOpenEditExpense={onOpenEditExpense || (() => {})}
              onDeleteExpense={async (exp) => {
                if (!window.confirm(`「${exp.title}」の支出記録を削除しますか？`)) return;
                await expenseRepository.delete(exp.id);
                await refreshAllData();
                showToast('支出記録を削除しました', 'info');
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <GoodsAnalyticsTab
              goods={filteredByOshiGoods}
              oshis={oshis}
              themeColor={themeColor}
            />
          )}
        </div>

        {/* 右ペイン（PC・タブレット用 固定インスペクター） */}
        <aside className="goods-inspector-pane" aria-label="グッズ詳細プレビュー">
          <GoodsDetailInspector
            item={selectedItem}
            onEdit={handleEditGoods}
            onDelete={handleDeleteGoods}
            onToggleFavorite={handleToggleFavorite}
            onMoveToOwned={handleMoveToOwned}
            onUpdateQuantity={handleUpdateQuantity}
            onImageFileSelect={handleImageFileSelect}
            isMobileModal={false}
          />
        </aside>
      </div>

      {/* モバイル用 詳細モーダル */}
      {isMobileModalOpen && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => setIsMobileModalOpen(false)}
        >
          <div
            ref={mobileDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="goods-mobile-detail-title"
            className="modal-box"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GoodsDetailInspector
              item={selectedItem}
              onClose={() => setIsMobileModalOpen(false)}
              onEdit={handleEditGoods}
              onDelete={handleDeleteGoods}
              onToggleFavorite={handleToggleFavorite}
              onMoveToOwned={handleMoveToOwned}
              onUpdateQuantity={handleUpdateQuantity}
              onImageFileSelect={handleImageFileSelect}
              isMobileModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
