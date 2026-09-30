import React, { useState, useEffect } from 'react';
import type { Goods, GoodsCategory, GoodsOpenStatus } from '../../types';
import { Modal } from '../common/Modal';
import { goodsRepository } from '../../repository';
import { useApp } from '../../context/AppContext';
import { resizeAndConvertImageToBase64 } from '../../utils/helpers';
import { GOODS_CATEGORY_CONFIG, GOODS_STATUS_CONFIG } from '../common/Badge';
import { Camera, Trash2, Heart, Image as ImageIcon } from 'lucide-react';

interface GoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGoods?: Goods | null;
}

export const GoodsModal: React.FC<GoodsModalProps> = ({
  isOpen,
  onClose,
  targetGoods,
}) => {
  const { oshis, activeOshiId, refreshAllData, showToast } = useApp();

  const [name, setName] = useState('');
  const [oshiId, setOshiId] = useState('');
  const [category, setCategory] = useState<GoodsCategory>('acrylic');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState<number | ''>(1000);
  const [quantity, setQuantity] = useState<number>(1);
  const [openStatus, setOpenStatus] = useState<GoodsOpenStatus>('opened');
  const [storageLocation, setStorageLocation] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetGoods) {
      setName(targetGoods.name);
      setOshiId(targetGoods.oshiId || '');
      setCategory(targetGoods.category || 'acrylic');
      setPurchaseDate(targetGoods.purchaseDate || '');
      setPrice(targetGoods.price);
      setQuantity(targetGoods.quantity || 1);
      setOpenStatus(targetGoods.openStatus || 'opened');
      setStorageLocation(targetGoods.storageLocation || '');
      setImage(targetGoods.image);
      setIsFavorite(!!targetGoods.isFavorite);
      setMemo(targetGoods.memo || '');
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      setName('');
      setOshiId(activeOshiId !== 'all' ? activeOshiId : (oshis[0]?.id || ''));
      setCategory('acrylic');
      setPurchaseDate(todayStr);
      setPrice(1000);
      setQuantity(1);
      setOpenStatus('opened');
      setStorageLocation('');
      setImage(undefined);
      setIsFavorite(false);
      setMemo('');
    }
  }, [targetGoods, activeOshiId, oshis, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeAndConvertImageToBase64(file, 800, 0.85);
      setImage(base64);
    } catch {
      showToast('画像の読み込みに失敗しました', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('グッズ名を入力してください', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const goodsData: Goods = {
        id: targetGoods?.id || `goods-${Date.now()}`,
        name: name.trim(),
        oshiId: oshiId || undefined,
        category,
        purchaseDate: purchaseDate || undefined,
        price: Number(price) || 0,
        quantity: Math.max(1, Number(quantity) || 1),
        openStatus,
        storageLocation: storageLocation.trim() || undefined,
        image,
        isFavorite,
        memo: memo.trim() || undefined,
        createdAt: targetGoods?.createdAt || now,
        updatedAt: now,
      };

      await goodsRepository.save(goodsData);
      await refreshAllData();
      showToast(targetGoods ? 'グッズ情報を更新しました' : 'グッズを登録しました！✨', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('グッズの保存に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetGoods ? 'グッズの編集' : '新しいグッズの登録'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload & Preview */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            グッズ写真（バックアップにも含まれます）
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 group">
              {image ? (
                <>
                  <img src={image} alt="グッズプレビュー" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage(undefined)}
                    className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-semibold"
                  >
                    <Trash2 className="w-5 h-5 mb-1" />
                    削除
                  </button>
                </>
              ) : (
                <div className="text-center p-2 text-gray-400">
                  <ImageIcon className="w-7 h-7 mx-auto mb-1 stroke-1" />
                  <span className="text-[10px] block leading-tight">写真なし</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold cursor-pointer transition">
                <Camera className="w-4 h-4" />
                <span>{image ? '写真を変える' : '写真を選択 / 撮影'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-gray-400">
                スマートフォンならその場で撮影した写真も登録できます。
              </p>
            </div>
          </div>
        </div>

        {/* Goods Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            グッズ名 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="例: アクリルスタンド 2026夏ver."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />
        </div>

        {/* Oshi & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              推し
            </label>
            <select
              value={oshiId}
              onChange={(e) => setOshiId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
            >
              <option value="">指定なし</option>
              {oshis.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GoodsCategory)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
            >
              {(Object.keys(GOODS_CATEGORY_CONFIG) as GoodsCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {GOODS_CATEGORY_CONFIG[cat].icon} {GOODS_CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price & Quantity & Purchase Date */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              金額 (円)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-2.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              数量
            </label>
            <input
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-2.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              購入日
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-2 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
            />
          </div>
        </div>

        {/* Open Status & Storage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              開封状態
            </label>
            <select
              value={openStatus}
              onChange={(e) => setOpenStatus(e.target.value as GoodsOpenStatus)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
            >
              {(Object.keys(GOODS_STATUS_CONFIG) as GoodsOpenStatus[]).map((st) => (
                <option key={st} value={st}>
                  {GOODS_STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              保管場所
            </label>
            <input
              type="text"
              placeholder="例: 自宅祭壇 / ファイル3"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>
        </div>

        {/* Favorite toggle */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
            <span>お気に入りグッズに設定</span>
          </button>
        </div>

        {/* Memo */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            メモ
          </label>
          <textarea
            rows={2}
            placeholder="特典情報、ロット、感想など"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : targetGoods ? '更新する' : '登録する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
