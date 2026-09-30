import React, { useState } from 'react';
import type { Goods } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { GoodsCategoryBadge, GoodsStatusBadge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { goodsRepository } from '../../repository';
import { formatCurrency, formatJapaneseDate } from '../../utils/helpers';
import { Heart, Edit, Trash2, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';

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
      showToast('削除に失敗しました', 'error');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const updated: Goods = {
        ...goods,
        isFavorite: !goods.isFavorite,
      };
      await goodsRepository.save(updated);
      await refreshAllData();
      showToast(updated.isFavorite ? 'お気に入りに追加しました💖' : 'お気に入りを解除しました', 'info');
    } catch {
      showToast('更新に失敗しました', 'error');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="グッズ詳細" maxWidth="md">
        <div className="space-y-4">
          {/* Image Display */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
            {goods.image ? (
              <img
                src={goods.image}
                alt={goods.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="text-center text-gray-300">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 stroke-1" />
                <span className="text-xs">写真が登録されていません</span>
              </div>
            )}

            {/* Favorite button */}
            <button
              onClick={handleToggleFavorite}
              className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-md hover:scale-110 transition"
              title="お気に入り"
            >
              <Heart
                className={`w-5 h-5 ${goods.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-gray-400'}`}
              />
            </button>
          </div>

          {/* Title & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <GoodsCategoryBadge category={goods.category} />
              <GoodsStatusBadge status={goods.openStatus} />
              {oshi && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${oshi.color}15`,
                    color: oshi.color,
                  }}
                >
                  <Heart className="w-3 h-3 fill-current" />
                  <span>{oshi.name}</span>
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {goods.name}
            </h2>
          </div>

          {/* Pricing & Quantity Card */}
          <div className="bg-gradient-to-r from-pink-50/70 to-rose-50/40 rounded-2xl p-4 border border-pink-100/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">価格 × 数量</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-pink-600">
                  {formatCurrency(goods.price)}
                </span>
                {goods.quantity > 1 && (
                  <span className="text-xs text-gray-500 font-semibold">
                    (× {goods.quantity}個 = {formatCurrency(goods.price * goods.quantity)})
                  </span>
                )}
              </div>
            </div>
            {goods.storageLocation && (
              <div className="text-right">
                <span className="text-[11px] text-gray-400 block font-medium">保管場所</span>
                <span className="text-xs font-bold text-gray-700 flex items-center justify-end gap-1">
                  <MapPin className="w-3 h-3 text-pink-500" />
                  {goods.storageLocation}
                </span>
              </div>
            )}
          </div>

          {/* Purchase Date & Memo */}
          <div className="space-y-2 text-sm bg-gray-50/60 rounded-xl p-3.5 border border-gray-100">
            {goods.purchaseDate && (
              <div className="flex items-center gap-2 text-gray-600 text-xs">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>購入日: {formatJapaneseDate(goods.purchaseDate)}</span>
              </div>
            )}
            {goods.memo && (
              <div className="pt-2 border-t border-gray-200/60">
                <p className="text-xs font-semibold text-gray-500 mb-1">メモ</p>
                <p className="text-gray-800 text-xs whitespace-pre-wrap leading-relaxed">
                  {goods.memo}
                </p>
              </div>
            )}
          </div>

          {/* Footer Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="text-xs text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 flex items-center gap-1.5 font-medium transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>削除</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(goods);
              }}
              className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-xs"
            >
              <Edit className="w-4 h-4" />
              <span>編集</span>
            </button>
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
        variant="danger"
      />
    </>
  );
};
