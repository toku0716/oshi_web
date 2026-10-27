import React from 'react';

const PRESET_COLORS = [
  { name: 'ローズピンク', hex: '#f43f5e' },
  { name: 'コーラルピンク', hex: '#ec4899' },
  { name: 'レッド', hex: '#ef4444' },
  { name: 'オレンジ', hex: '#f97316' },
  { name: 'イエロー', hex: '#eab308' },
  { name: 'エメラルド', hex: '#10b981' },
  { name: 'スカイブルー', hex: '#0ea5e9' },
  { name: 'ロイヤルブルー', hex: '#3b82f6' },
  { name: 'パープル', hex: '#a855f7' },
  { name: 'ブラック', hex: '#1e293b' },
];

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label = 'メンバーカラー（画面テーマに連動）',
}) => {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="chip-group" style={{ alignItems: 'center' }}>
        {PRESET_COLORS.map((c) => {
          const isSelected = value.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex}
              type="button"
              className="chip"
              onClick={() => onChange(c.hex)}
              style={{
                borderColor: isSelected ? c.hex : undefined,
                backgroundColor: isSelected ? c.hex : '#ffffff',
                color: isSelected ? '#ffffff' : '#18181b',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#ffffff' : c.hex,
                  marginRight: '5px',
                }}
              />
              {c.name}
            </button>
          );
        })}
        <label className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span>自由選択</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: '22px', height: '22px', border: 'none', padding: 0, background: 'none' }}
          />
        </label>
      </div>
    </div>
  );
};
