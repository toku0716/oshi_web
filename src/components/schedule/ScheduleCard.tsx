import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { EVENT_CATEGORY_META, type OshiEvent } from '../../types';
import { getEventLiveCountdown, isEventEnded } from '../../utils/oshiUtils';
import { pressable } from '../../utils/a11y';

interface ScheduleCardProps {
  event: OshiEvent;
  currentTime?: Date;
  onClick: (event: OshiEvent) => void;
}

/**
 * 予定カードコンポーネント（和風モダン・ミニマル仕様）
 * - 英語ラベルや過剰な操作案内を排した静謐な佇まい
 * - 上段（左寄せ）：h1見出しの予定名 ＋ ベースライン揃えの開始時刻（例: "22:22 開始"）
 * - 下段（中央配置）：十分な余白をとった残り時間カウントダウン（font-mono / tabular-nums）
 * - 全面タップ可能（微小なホバー/アクティブ色変化）
 */
export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  event,
  currentTime = new Date(),
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const ended = isEventEnded(event);
  const countdown = getEventLiveCountdown(event, currentTime);
  const isBeforeStart = !ended && countdown.hasTime && !countdown.isStarted && !countdown.isEnded;

  // 下段にゆったり配置する残り時間テキスト
  let remainingText = '';
  if (ended) {
    remainingText = '終了';
  } else if (isBeforeStart) {
    remainingText = `あと ${countdown.formatted}`;
  } else if (countdown.isStarted) {
    remainingText = '開催中';
  } else {
    remainingText = '本日';
  }

  // 開始時刻表示テキスト（例: "22:22 開始"、未設定の場合は "終日"）
  const startTimeText = event.time ? `${event.time} 開始` : '終日';

  return (
    <div
      {...pressable(() => onClick(event))}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
      style={{
        backgroundColor: isActive ? '#191B1F' : isHovered ? '#23262D' : '#1C1E23',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: 'clamp(24px, 5vw, 32px) clamp(20px, 4.5vw, 28px)',
        cursor: 'pointer',
        boxShadow: isHovered
          ? '0 12px 32px rgba(0, 0, 0, 0.45)'
          : '0 6px 24px rgba(0, 0, 0, 0.3)',
        transform: isActive ? 'scale(0.995)' : 'none',
        transition:
          'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      {/* 0. イベントの種類バッジ */}
      {event.category && EVENT_CATEGORY_META[event.category] && (
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: `${EVENT_CATEGORY_META[event.category].color}25`,
              color: EVENT_CATEGORY_META[event.category].color,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>{EVENT_CATEGORY_META[event.category].icon}</span>
            <span>{EVENT_CATEGORY_META[event.category].label}</span>
          </span>
        </div>
      )}

      {/* 1. 上段（左寄せ）：予定名をh1見出しで配置、そのすぐ右隣にベースライン揃えで開始時刻を表示 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(28px, 6.5vw, 38px)',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            wordBreak: 'break-word',
          }}
        >
          {event.title}
        </h1>
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: '#9CA3AF',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {startTimeText}
        </span>
      </div>

      {/* 2. 下段（中央配置）：カウントダウンを枠線・背景でしっかり囲い、視認性を大幅向上 */}
      <div
        style={{
          marginTop: 'clamp(20px, 4.5vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 22px',
            borderRadius: 9999,
            backgroundColor: isBeforeStart
              ? 'rgba(255, 255, 255, 0.08)'
              : countdown.isStarted
              ? 'rgba(52, 199, 89, 0.15)'
              : 'rgba(255, 255, 255, 0.05)',
            border: isBeforeStart
              ? '1.5px solid rgba(255, 255, 255, 0.22)'
              : countdown.isStarted
              ? '1.5px solid rgba(52, 199, 89, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Clock
            size={18}
            color={
              countdown.isStarted
                ? '#34C759'
                : isBeforeStart
                ? '#60A5FA'
                : '#9CA3AF'
            }
            strokeWidth={2.4}
          />
          <span
            style={{
              fontSize: 'clamp(15px, 4vw, 18px)',
              fontWeight: 800,
              color: countdown.isStarted ? '#34C759' : '#FFFFFF',
              letterSpacing: '0.06em',
              fontFamily:
                'var(--font-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {remainingText}
          </span>
        </div>
      </div>
    </div>
  );
};
