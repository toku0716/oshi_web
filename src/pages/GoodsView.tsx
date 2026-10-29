import React, { useState, useMemo } from 'react';
import {
  Clock,
  CreditCard,
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
import { GoodsOrdersTab } from '../components/goods/GoodsOrdersTab';
import { GoodsExpensesTab } from '../components/goods/GoodsExpensesTab';
import { GoodsDetailInspector } from '../components/goods/GoodsDetailInspector';

interface GoodsViewProps {
  onOpenAddGoods: (isWish: boolean) => void;
  onOpenEditGoods: (goods: Goods) => void;
  onOpenAddExpense?: () => void;
  onOpenEditExpense?: (expense: ExpenseItem) => void;
}

type MainTab = 'gallery' | 'orders' | 'expenses';

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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // 最新のグッズデータ
  const selectedItem = useMemo(
    () => (selectedItemId ? goods.find((g) => g.id === selectedItemId) || null : null),
    [goods, selectedItemId]
  );

  // モーダルダイアログ制御
  const dialogRef = useDialog<HTMLDivElement>(
    isDetailModalOpen,
    () => setIsDetailModalOpen(false)
  );

  // アクティブ推しでフィルタリングされたグッズ一覧
  const filteredByOshiGoods = useMemo(() => {
    if (activeOshiId === 'all') return goods;
    return goods.filter((g) => !g.oshiId || g.oshiId === activeOshiId);
  }, [goods, activeOshiId]);

  // 各タブのカウント
  const ownedCount = useMemo(
    () => filteredByOshiGoods.filter((g) => !g.isWish && !g.isPreorder).length,
    [filteredByOshiGoods]
  );
  const ordersCount = useMemo(
    () => filteredByOshiGoods.filter((g) => g.isPreorder || g.isWish).length,
    [filteredByOshiGoods]
  );

  // グッズ選択ハンドラ (カードタップで詳細モーダルを表示)
  const handleSelectItem = (item: Goods) => {
    setSelectedItemId(item.id);
    setIsDetailModalOpen(true);
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
    setIsDetailModalOpen(false);

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
    setIsDetailModalOpen(false);
    showToast('グッズを削除しました', 'info');
  };

  // 編集モーダルを開く
  const handleEditGoods = (item: Goods) => {
    setIsDetailModalOpen(false);
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

        {/* ヘッダー追加ボタン */}
        {activeTab === 'gallery' && (
          <button
            type="button"
            onClick={() => onOpenAddGoods(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 3px 12px ${themeColor}44`,
            }}
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>グッズを登録</span>
          </button>
        )}
        {activeTab === 'orders' && (
          <button
            type="button"
            onClick={() => onOpenAddGoods(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 3px 12px ${themeColor}44`,
            }}
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>予約・欲しいもの登録</span>
          </button>
        )}
        {activeTab === 'expenses' && onOpenAddExpense && (
          <button
            type="button"
            onClick={onOpenAddExpense}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 3px 12px ${themeColor}44`,
            }}
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>支出を記録</span>
          </button>
        )}
      </div>

      {/* シンプルな3タブバー */}
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
        }}
      >
        {[
          { key: 'gallery', label: '一覧', icon: ShoppingBag, count: ownedCount },
          { key: 'orders', label: '予約・欲しいもの', icon: Clock, count: ordersCount },
          { key: 'expenses', label: '支出記録', icon: CreditCard, count: expenses.length },
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 8px',
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
            </button>
          );
        })}
      </div>

      {/* メインコンテンツ（全幅表示） */}
      <div>
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
      </div>

      {/* グッズ詳細モーダル（タップ時に全画面サイズでポップアップ） */}
      {isDetailModalOpen && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="goods-mobile-detail-title"
            className="modal-box"
            style={{ maxWidth: 480, width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <GoodsDetailInspector
              item={selectedItem}
              onClose={() => setIsDetailModalOpen(false)}
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
