import React from 'react';

const PRESET_COLORS = [
  { name: 'ローズピンク', hex: '#f43f5e' },
  { name: 'チェリーピンク', hex: '#ec4899' },
  { name: 'レッド', hex: '#ef4444' },
  { name: 'オレンジ', hex: '#f97316' },
  { name: 'イエロー', hex: '#eab308' },
  { name: 'エメラルドグリーン', hex: '#10b981' },
  { name: 'ミントグリーン', hex: '#14b8a6' },
  { name: 'スカイブルー', hex: '#0ea5e9' },
  { name: 'ロイヤルブルー', hex: '#3b82f6' },
  { name: 'パープル', hex: '#a855f7' },
  { name: 'バイオレット', hex: '#8b5cf6' },
  { name: 'ブラック/ダーク', hex: '#334155' },
];

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label = 'メンバーカラー',
}) => {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESET_COLORS.map((c) => {
          const isSelected = value.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => onChange(c.hex)}
              title={c.name}
              className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center relative ${
                isSelected ? 'scale-110 ring-2 ring-offset-2 ring-gray-900 shadow-sm' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#f43f5e"
          className="w-28 px-2.5 py-1 text-xs font-mono rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-pink-500 uppercase"
        />
        <span className="text-xs text-gray-400">推しを象徴するカラーを選択</span>
      </div>
    </div>
  );
};
