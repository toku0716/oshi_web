import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, CalendarPlus, Users, Palette } from 'lucide-react';

interface HeaderProps {
  onAddOshiClick?: () => void;
  onQuickAddEvent?: () => void;
}

const HEADER_THEME_COLORS = [
  { name: 'ローズ', hex: '#f43f5e' },
  { name: 'ピンク', hex: '#ec4899' },
  { name: 'レッド', hex: '#ef4444' },
  { name: 'オレンジ', hex: '#f97316' },
  { name: 'イエロー', hex: '#eab308' },
  { name: 'エメラルド', hex: '#10b981' },
  { name: 'スカイ', hex: '#0ea5e9' },
  { name: 'ブルー', hex: '#3b82f6' },
  { name: 'パープル', hex: '#a855f7' },
  { name: 'ブラック', hex: '#1e293b' },
];

export const Header: React.FC<HeaderProps> = ({ onAddOshiClick, onQuickAddEvent }) => {
  const {
    oshis,
    activeOshiId,
    setActiveOshiId,
    activeOshi,
    themeColor,
    setThemeColor,
  } = useApp();

  const currentColor = (activeOshi?.color || themeColor || '#f43f5e').toLowerCase();

  const today = new Date();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const formattedToday = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日(${weekdays[today.getDay()]})`;

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-group">
          <div className="brand-mark">推</div>
          <h1 className="app-title">推しサポ</h1>
          <span className="app-date">{formattedToday}</span>
        </div>

        <div className="flex-row">
          {/* テーマカラー即時変更パレット */}
          <div className="theme-palette" title="テーマカラーを変更">
            <Palette className="icon-xs text-muted" style={{ marginLeft: '2px' }} />
            {HEADER_THEME_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                className={`theme-dot ${currentColor === c.hex.toLowerCase() ? 'active' : ''}`}
                style={{ backgroundColor: c.hex }}
                onClick={() => setThemeColor(c.hex)}
                title={`テーマカラー: ${c.name}`}
              />
            ))}
            <label
              className="text-small text-muted"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
                marginLeft: '2px',
              }}
              title="自由な色を選択"
            >
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setThemeColor(e.target.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  border: 'none',
                  padding: 0,
                  background: 'none',
                  cursor: 'pointer',
                }}
              />
            </label>
          </div>

          {onAddOshiClick && (
            <button type="button" className="btn-sm" onClick={onAddOshiClick}>
              <Plus className="icon-xs" />
              <span>推し追加</span>
            </button>
          )}
          {onQuickAddEvent && (
            <button type="button" className="btn-sm btn-primary" onClick={onQuickAddEvent}>
              <CalendarPlus className="icon-xs" />
              <span>予定を登録</span>
            </button>
          )}
        </div>
      </div>

      {/* Oshi Avatar Switcher Ribbon */}
      <div className="oshi-ribbon">
        <button
          type="button"
          className={`oshi-pill ${activeOshiId === 'all' ? 'active' : ''}`}
          onClick={() => setActiveOshiId('all')}
        >
          <span className="oshi-avatar-mini" style={{ backgroundColor: '#71717a' }}>
            <Users className="icon-xs" />
          </span>
          <span>全員 ({oshis.length})</span>
        </button>

        {oshis.map((o) => {
          const isActive = activeOshiId === o.id;
          return (
            <button
              key={o.id}
              type="button"
              className={`oshi-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveOshiId(o.id)}
            >
              {o.image ? (
                <img src={o.image} alt={o.name} className="oshi-avatar-mini" />
              ) : (
                <span
                  className="oshi-avatar-mini"
                  style={{ backgroundColor: o.color || '#f43f5e' }}
                >
                  {o.name.slice(0, 1)}
                </span>
              )}
              <span>{o.name}</span>
            </button>
          );
        })}

        {onAddOshiClick && oshis.length === 0 && (
          <button type="button" className="oshi-pill" onClick={onAddOshiClick}>
            <Plus className="icon-xs" />
            <span>最初の推しを登録する</span>
          </button>
        )}
      </div>
    </header>
  );
};
