import React, { useState, useEffect } from 'react';
import type { Goods, GoodsCategory, GoodsOpenStatus } from '../../types';
import { Modal } from '../common/Modal';
import { goodsRepository } from '../../repository';
import { useApp } from '../../context/AppContext';
import { resizeAndConvertImageToBase64 } from '../../utils/helpers';
import { GOODS_CATEGORY_CONFIG, GOODS_STATUS_CONFIG } from '../common/Badge';

interface GoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGoods?: Goods | null;
}

const STORAGE_PRESETS = [
  'ディスプレイ棚',
  '参戦用バッグ',
  'アクスタケース',
  'バインダー・ファイル',
  '保管ボックス',
];

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
  const [price, setPrice] = useState<number | ''>(1500);
  const [quantity, setQuantity] = useState<number>(1);
  const [openStatus, setOpenStatus] = useState<GoodsOpenStatus>('display');
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
      setPrice(1500);
      setQuantity(1);
      setOpenStatus('display');
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
      showToast(targetGoods ? 'グッズ情報を更新しました' : 'グッズを登録しました', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('グッズ情報の保存に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetGoods ? 'グッズの編集' : 'グッズを登録'}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-row">
          <div className="form-group">
            <label>グッズ名 (必須)</label>
            <input
              type="text"
              required
              placeholder="例: 2026ツアー アクリルスタンド"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>対象の推し</label>
            <select value={oshiId} onChange={(e) => setOshiId(e.target.value)}>
              <option value="">指定なし</option>
              {oshis.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>カテゴリー</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GoodsCategory)}
            >
              {(Object.keys(GOODS_CATEGORY_CONFIG) as GoodsCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {GOODS_CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>状態</label>
            <select
              value={openStatus}
              onChange={(e) => setOpenStatus(e.target.value as GoodsOpenStatus)}
            >
              {(Object.keys(GOODS_STATUS_CONFIG) as GoodsOpenStatus[]).map((st) => (
                <option key={st} value={st}>
                  {GOODS_STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>単価 (円)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>所持数 (個)</label>
            <input
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>購入日</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>保管場所</label>
          <input
            type="text"
            placeholder="例: ディスプレイ棚 / ケースA"
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
          />
          <div className="chip-group" style={{ marginTop: '4px' }}>
            {STORAGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="chip"
                onClick={() => setStorageLocation(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>グッズ写真</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {image && (
              <div className="flex-row" style={{ marginTop: '4px' }}>
                <img src={image} alt="プレビュー" width="60" />
                <button
                  type="button"
                  className="btn-sm btn-danger"
                  onClick={() => setImage(undefined)}
                >
                  写真を削除
                </button>
              </div>
            )}
          </div>

          <div className="form-group" style={{ justifyContent: 'center' }}>
            <label className="flex-row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
              />
              <span>お気に入り登録</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>メモ</label>
          <textarea
            rows={2}
            placeholder="購入店舗、特典、メモなど"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : targetGoods ? '更新する' : '登録する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
