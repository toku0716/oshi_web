import React, { useState, useEffect } from 'react';
import { type Oshi, OSHI_CATEGORIES } from '../../types';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { oshiRepository } from '../../repository';
import { useApp } from '../../context/AppContext';
import { resizeAndConvertImageToBase64 } from '../../utils/helpers';
import { Camera, Trash2, Heart } from 'lucide-react';

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
  const [color, setColor] = useState('#f43f5e');
  const [debutDate, setDebutDate] = useState('');
  const [memo, setMemo] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetOshi) {
      setName(targetOshi.name);
      setRuby(targetOshi.ruby || '');
      setGroup(targetOshi.group || '');
      setCategory(targetOshi.category || '');
      setColor(targetOshi.color || '#f43f5e');
      setDebutDate(targetOshi.debutDate || '');
      setMemo(targetOshi.memo || '');
      setImage(targetOshi.image);
    } else {
      setName('');
      setRuby('');
      setGroup('');
      setCategory('');
      setColor('#f43f5e');
      setDebutDate('');
      setMemo('');
      setImage(undefined);
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
        createdAt: targetOshi?.createdAt || now,
        updatedAt: now,
      };

      await oshiRepository.save(oshiData);
      await refreshAllData();
      showToast(targetOshi ? '推しの情報を更新しました' : '新しい推しを登録しました', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('保存に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetOshi ? '推し情報の編集' : '新しい推しを登録'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo Upload & Preview */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-full border-4 overflow-hidden flex items-center justify-center bg-gray-100 shadow-md relative"
              style={{ borderColor: color }}
            >
              {image ? (
                <img src={image} alt="推しプレビュー" className="w-full h-full object-cover" />
              ) : (
                <Heart className="w-10 h-10 text-gray-300" />
              )}
            </div>

            <label
              className="absolute bottom-0 right-0 p-2 rounded-full bg-gray-900 text-white hover:bg-gray-800 shadow-md cursor-pointer transition transform hover:scale-110"
              title="写真を登録・変更"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          {image && (
            <button
              type="button"
              onClick={() => setImage(undefined)}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>写真を削除</span>
            </button>
          )}
        </div>

        {/* Name & Ruby */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              推しの名前 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: 山田 花子"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ふりがな
            </label>
            <input
              type="text"
              placeholder="例: やまだ　はなこ "
              value={ruby}
              onChange={(e) => setRuby(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>
        </div>

        {/* Category (Genre) & Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              種類 / ジャンル
            </label>
            <input
              type="text"
              list="oshi-category-presets"
              placeholder="例: アイドル、アニメなど"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#35384d] focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white dark:bg-[#1a1b26] text-gray-900 dark:text-white"
            />
            <datalist id="oshi-category-presets">
              {OSHI_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              グループ / 所属
            </label>
            <input
              type="text"
              placeholder="例: グループ名、作品名など"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#35384d] focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white dark:bg-[#1a1b26] text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Quick Select Chips */}
        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">種類をワンタップで選択（自由入力も可）:</p>
          <div className="flex flex-wrap gap-1.5">
            {OSHI_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(isSelected ? '' : cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-[#1f212d] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#35384d] hover:bg-gray-100 dark:hover:bg-[#282a3a]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Member Color */}
        <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {/* Anniversary / Debut Date */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              推し始めた日・記念日 <span className="text-[11px] font-normal text-gray-400">（未設定でもOK）</span>
            </label>
            {debutDate && (
              <button
                type="button"
                onClick={() => setDebutDate('')}
                className="text-[11px] text-gray-400 hover:text-rose-500 transition"
              >
                ✕ 日付を解除
              </button>
            )}
          </div>
          <input
            type="date"
            value={debutDate}
            onChange={(e) => setDebutDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#35384d] focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white dark:bg-[#1a1b26] text-gray-900 dark:text-white"
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
            ※「いつの間にか好きになっていた」など正確な日付が分からない場合は空欄のままで構いません。大体の年月や、ファンクラブ入会日などを設定してもOKです。
          </p>
        </div>

        {/* Memo */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            メモ / 好きなところ
          </label>
          <textarea
            rows={2}
            placeholder="ファンネーム、好きな歌、惹かれたきっかけなど"
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
            {isSubmitting ? '保存中...' : targetOshi ? '更新' : '登録'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
