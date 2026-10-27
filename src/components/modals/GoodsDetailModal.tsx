import React, { useState } from 'react';
import type { Goods } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { GoodsCategoryBadge, GoodsStatusBadge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { goodsRepository } from '../../repository';
import { formatCurrency, formatJapaneseDate } from '../../utils/helpers';

interface GoodsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goods: Goods | null;
  onEdit: (goods: Goods) => void;
}

export const GoodsDetailModal: React.FC<GoodsDetailModalProps> = ({
  isOpen,
  onClose,
  goods,
  onEdit,
}) => {
  const { oshis, refreshAllData, showToast } = useApp();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!goods) return null;

  const oshi = oshis.find((o) => o.id === goods.oshiId);

  const handleDelete = async () => {
    try {
      await goodsRepository.delete(goods.id);
      await refreshAllData();
      showToast('グッズを削除しました', 'info');
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch {
      showToast('削除処理に失敗しました', 'error');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const updated: Goods = {
        ...goods,
        isFavorite: !goods.isFavorite,
        updatedAt: new Date().toISOString(),
      };
      await goodsRepository.save(updated);
      await refreshAllData();
      showToast(
        updated.isFavorite ? 'お気に入りに追加しました' : 'お気に入りを解除しました',
        'info'
      );
    } catch {
      showToast('更新処理に失敗しました', 'error');
    }
  };

  const handleChangeQuantity = async (delta: number) => {
    const nextQty = Math.max(1, (goods.quantity || 1) + delta);
    if (nextQty === goods.quantity) return;
    try {
      const updated: Goods = {
        ...goods,
        quantity: nextQty,
        updatedAt: new Date().toISOString(),
      };
      await goodsRepository.save(updated);
      await refreshAllData();
      showToast(`所持数を ${nextQty}個 に更新しました`, 'info');
    } catch {
      showToast('数量の更新に失敗しました', 'error');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="グッズ詳細">
        <div className="form-stack">
          {goods.image && (
            <div>
              <img src={goods.image} alt={goods.name} width="160" />
            </div>
          )}

          <div>
            <div className="flex-row" style={{ marginBottom: '6px' }}>
              <GoodsCategoryBadge category={goods.category} />
              <GoodsStatusBadge status={goods.openStatus} />
              {oshi && <span className="badge">推し: {oshi.name}</span>}
              {goods.isFavorite && <span className="badge badge-warning">お気に入り</span>}
            </div>
            <h3 style={{ margin: '0 0 8px' }}>{goods.name}</h3>
          </div>

          <div className="card" style={{ marginBottom: 0 }}>
            <div className="flex-between">
              <div>
                <strong>
                  総額: {formatCurrency(goods.price * (goods.quantity || 1))}
                </strong>{' '}
                <span className="text-muted">
                  ({formatCurrency(goods.price)} × {goods.quantity || 1}個)
                </span>
              </div>
              <div className="flex-row">
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => handleChangeQuantity(-1)}
                  disabled={goods.quantity <= 1}
                >
                  -1
                </button>
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => handleChangeQuantity(1)}
                >
                  +1
                </button>
              </div>
            </div>
          </div>

          <div>
            {goods.storageLocation && (
              <p>
                <strong>保管場所:</strong> {goods.storageLocation}
              </p>
            )}
            {goods.purchaseDate && (
              <p>
                <strong>購入日:</strong> {formatJapaneseDate(goods.purchaseDate)}
              </p>
            )}
            {goods.memo && (
              <p>
                <strong>メモ:</strong> {goods.memo}
              </p>
            )}
          </div>

          <div className="flex-between">
            <button
              type="button"
              className="btn-danger"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              削除
            </button>
            <div className="flex-row">
              <button type="button" onClick={handleToggleFavorite}>
                {goods.isFavorite ? 'お気に入り解除' : 'お気に入り登録'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onEdit(goods);
                }}
              >
                編集する
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="グッズの削除"
        message={`「${goods.name}」を削除してもよろしいですか？`}
        confirmLabel="削除する"
      />
    </>
  );
};
