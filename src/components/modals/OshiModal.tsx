import React, { useState, useEffect } from 'react';
import { type Oshi, OSHI_CATEGORIES } from '../../types';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { oshiRepository } from '../../repository';
import { useApp } from '../../context/AppContext';
import { resizeAndConvertImageToBase64 } from '../../utils/helpers';

interface OshiModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetOshi?: Oshi | null;
}

export const OshiModal: React.FC<OshiModalProps> = ({
  isOpen,
  onClose,
  targetOshi,
}) => {
  const { refreshAllData, showToast } = useApp();
  const [name, setName] = useState('');
  const [ruby, setRuby] = useState('');
  const [group, setGroup] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [debutDate, setDebutDate] = useState('');
  const [memo, setMemo] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [imagePosition, setImagePosition] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetOshi) {
      setName(targetOshi.name);
      setRuby(targetOshi.ruby || '');
      setGroup(targetOshi.group || '');
      setCategory(targetOshi.category || '');
      setColor(targetOshi.color || '#2563eb');
      setDebutDate(targetOshi.debutDate || '');
      setMemo(targetOshi.memo || '');
      setImage(targetOshi.image);
      const match = targetOshi.imagePosition?.match(/(\d+)%/);
      setImagePosition(match ? parseInt(match[1], 10) : 20);
    } else {
      setName('');
      setRuby('');
      setGroup('');
      setCategory('');
      setColor('#2563eb');
      setDebutDate('');
      setMemo('');
      setImage(undefined);
      setImagePosition(20);
    }
  }, [targetOshi, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeAndConvertImageToBase64(file, 600, 0.85);
      setImage(base64);
    } catch {
      showToast('画像の読み込みに失敗しました', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('推しの名前を入力してください', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const oshiData: Oshi = {
        id: targetOshi?.id || `oshi-${Date.now()}`,
        name: name.trim(),
        ruby: ruby.trim() || undefined,
        group: group.trim() || undefined,
        category: category.trim() || undefined,
        color,
        debutDate: debutDate || undefined,
        memo: memo.trim() || undefined,
        image,
        imagePosition: image ? `center ${imagePosition}%` : undefined,
        createdAt: targetOshi?.createdAt || now,
        updatedAt: now,
      };

      await oshiRepository.save(oshiData);
      await refreshAllData();
      showToast(targetOshi ? '推しの情報を更新しました' : '新しい推しを登録しました', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('情報の保存に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetOshi ? '推しの編集' : '新しい推しを登録'}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-row">
          <div className="form-group">
            <label>推しの名前 (必須)</label>
            <input
              type="text"
              required
              placeholder="例: アイドル名、キャラクター名など"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>フリガナ</label>
            <input
              type="text"
              placeholder="例: やまだ はなこ"
              value={ruby}
              onChange={(e) => setRuby(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>カテゴリー</label>
            <input
              type="text"
              list="oshi-category-presets"
              placeholder="例: アイドル、アニメ、VTuberなど"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="oshi-category-presets">
              {OSHI_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label>所属 / グループ名</label>
            <input
              type="text"
              placeholder="例: グループ名、作品名など"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>記念日・推し始めた日</label>
            <input
              type="date"
              value={debutDate}
              onChange={(e) => setDebutDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>プロフィール写真</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {image && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="flex-row">
                  <img
                    src={image}
                    alt="プレビュー"
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      objectFit: 'cover',
                      objectPosition: `center ${imagePosition}%`,
                    }}
                  />
                  <button
                    type="button"
                    className="btn-sm btn-danger"
                    onClick={() => setImage(undefined)}
                  >
                    写真を削除
                  </button>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                    <span>カバー画像の表示位置 (顔フォーカス)</span>
                    <span>{imagePosition}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={imagePosition}
                    onChange={(e) => setImagePosition(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <ColorPicker value={color} onChange={setColor} />

        <div className="form-group">
          <label>メモ・ファンクラブ情報</label>
          <textarea
            rows={2}
            placeholder="会員番号、公式SNS、メモなど"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : targetOshi ? '更新する' : '登録する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
