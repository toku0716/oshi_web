import React, { useState, useEffect } from 'react';
import { type Oshi, OSHI_CATEGORIES } from '../../types';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { oshiRepository } from '../../repository';
import { useApp } from '../../context/AppContext';
import { resizeAndConvertImageToBase64 } from '../../utils/helpers';
import { Camera, Trash2, User } from 'lucide-react';

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
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo Upload & Preview */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-full border-2 overflow-hidden flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.05] shadow-xs relative"
              style={{ borderColor: color }}
            >
              {image ? (
                <img src={image} alt="プレビュー" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer transition shadow-xs">
              <Camera className="w-3.5 h-3.5" />
              <span>カメラで撮影</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-neutral-700 dark:text-neutral-200 text-xs font-semibold cursor-pointer transition">
              <span>ファイルから選択</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {image && (
              <button
                type="button"
                onClick={() => setImage(undefined)}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium px-2 py-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>写真を削除</span>
              </button>
            )}
          </div>
        </div>

        {/* Name & Ruby */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              推しの名前 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: アイドル名、キャラクター名など"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              フリガナ (読み)
            </label>
            <input
              type="text"
              placeholder="例: やまだ はなこ"
              value={ruby}
              onChange={(e) => setRuby(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
            />
          </div>
        </div>

        {/* Category (Genre) & Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              カテゴリー
            </label>
            <input
              type="text"
              list="oshi-category-presets"
              placeholder="例: アイドル、アニメ、VTuberなど"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
            />
            <datalist id="oshi-category-presets">
              {OSHI_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              所属 / グループ名
            </label>
            <input
              type="text"
              placeholder="例: グループ名、所属事務所、作品名など"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
            />
          </div>
        </div>

        {/* Quick Select Chips */}
        <div>
          <p className="text-[11px] text-neutral-400 mb-1.5">カテゴリー選択（自由入力も可）:</p>
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
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-2xs'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] text-neutral-600 dark:text-neutral-400 border-[var(--border-subtle)] hover:bg-black/[0.05]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Member Color */}
        <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-[var(--border-subtle)]">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {/* Anniversary / Debut Date */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              活動開始日 / 記念日・推し始めた日 <span className="text-[11px] font-normal text-neutral-400">（任意）</span>
            </label>
            {debutDate && (
              <button
                type="button"
                onClick={() => setDebutDate('')}
                className="text-[11px] text-neutral-400 hover:text-rose-500 transition"
              >
                ✕ 日付を解除
              </button>
            )}
          </div>
          <input
            type="date"
            value={debutDate}
            onChange={(e) => setDebutDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
          />
        </div>

        {/* Memo */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            メモ・ファンクラブ情報
          </label>
          <textarea
            rows={2}
            placeholder="ファンクラブ会員番号、公式SNS、推し活メモなど"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-lg transition"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 rounded-lg transition shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : targetOshi ? '更新する' : '登録する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
