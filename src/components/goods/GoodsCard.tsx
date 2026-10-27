import React from 'react';
import { MapPin, Package, Star } from 'lucide-react';
import { GOODS_CATEGORY_META, GOODS_OPEN_STATUS_META, type Goods } from '../../types';
import { pressable } from '../../utils/a11y';

interface GoodsCardProps {
  item: Goods;
  oshiName?: string;
  oshiColor?: string;
  isSelected?: boolean;
  viewMode?: 'grid' | 'list';
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent, item: Goods) => void;
  onUpdateQuantity?: (e: React.MouseEvent, item: Goods, delta: number) => void;
  onMoveToOwned?: (item: Goods) => void;
}

export const GoodsCard: React.FC<GoodsCardProps> = ({
  item,
  oshiName,
  oshiColor,
  isSelected = false,
  viewMode = 'grid',
  onClick,
  onToggleFavorite,
  onUpdateQuantity,
  onMoveToOwned,
}) => {
  const categoryInfo = GOODS_CATEGORY_META[item.category] || GOODS_CATEGORY_META.other;
  const statusInfo = GOODS_OPEN_STATUS_META[item.openStatus] || GOODS_OPEN_STATUS_META.storage;

  // リスト表示
  if (viewMode === 'list') {
    return (
      <div
        {...pressable(onClick)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 14,
          backgroundColor: 'var(--bg-surface)',
          border: `1.5px solid ${isSelected ? 'var(--oshi-color)' : 'var(--border-subtle)'}`,
          boxShadow: isSelected ? '0 0 0 2px rgba(var(--oshi-color-rgb), 0.2)' : 'var(--shadow-card)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        aria-label={`グッズ: ${item.name}`}
      >
        {/* サムネイル */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: 'var(--bg-surface-subtle)',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Package size={22} strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* テキスト情報 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 4,
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {categoryInfo.label}
            </span>
            {oshiName && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: oshiColor || 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {oshiName}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              ¥{(item.price || 0).toLocaleString()}
            </span>

            {item.storageLocation && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <MapPin size={11} />
                {item.storageLocation}
              </span>
            )}
          </div>
        </div>

        {/* 右側アクション */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* お気に入りスター */}
          <button
            type="button"
            onClick={(e) => onToggleFavorite(e, item)}
            aria-label={item.isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: item.isFavorite ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: item.isFavorite ? '#F59E0B' : 'var(--text-muted)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* 数量コントロール (所持) */}
          {!item.isWish && !item.isPreorder && onUpdateQuantity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                type="button"
                onClick={(e) => onUpdateQuantity(e, item, -1)}
                aria-label="数量を減らす"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                -
              </button>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  minWidth: 18,
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                {item.quantity || 1}
              </span>
              <button
                type="button"
                onClick={(e) => onUpdateQuantity(e, item, 1)}
                aria-label="数量を増やす"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          )}

          {/* 予約・欲しいもの昇格ボタン */}
          {(item.isWish || item.isPreorder) && onMoveToOwned && (
            <button
              type="button"
              onClick={() => onMoveToOwned(item)}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                backgroundColor: item.isPreorder ? '#8B5CF6' : 'var(--oshi-color)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {item.isPreorder ? '届いた' : '買った'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // グリッド表示
  return (
    <div
      {...pressable(onClick)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 16,
        border: `1.5px solid ${isSelected ? 'var(--oshi-color)' : 'var(--border-subtle)'}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: isSelected ? '0 0 0 2px rgba(var(--oshi-color-rgb), 0.25)' : 'var(--shadow-card)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
      }}
      aria-label={`グッズ: ${item.name}`}
    >
      {/* 写真エリア */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          backgroundColor: 'var(--bg-surface-subtle)',
          overflow: 'hidden',
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Package size={34} strokeWidth={1.4} />
          </div>
        )}

        {/* カテゴリバッジ */}
        <span
          style={{
            position: 'absolute',
            top: 7,
            left: 7,
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 6,
            backgroundColor: 'rgba(0,0,0,0.68)',
            color: '#FFFFFF',
            backdropFilter: 'blur(4px)',
          }}
        >
          {categoryInfo.label}
        </span>

        {/* 右上：お気に入りスターボタン */}
        <button
          type="button"
          onClick={(e) => onToggleFavorite(e, item)}
          aria-label={item.isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: item.isFavorite ? '#F59E0B' : '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Star size={15} fill={item.isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* 状態バッジ (左下) */}
        {!item.isWish && !item.isPreorder && (
          <span
            style={{
              position: 'absolute',
              bottom: 7,
              left: 7,
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 5,
              backgroundColor: statusInfo.color,
              color: '#FFFFFF',
            }}
          >
            {statusInfo.label}
          </span>
        )}

        {/* 予約中バッジ */}
        {item.isPreorder && (
          <span
            style={{
              position: 'absolute',
              bottom: 7,
              left: 7,
              fontSize: 10.5,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 5,
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
            }}
          >
            予約済み
          </span>
        )}
      </div>

      {/* カード本体 */}
      <div
        style={{
          padding: '10px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flex: 1,
        }}
      >
        {oshiName && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: oshiColor || 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {oshiName}
          </span>
        )}

        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 35,
          }}
          title={item.name}
        >
          {item.name}
        </div>

        {/* 保管場所表示 */}
        {item.storageLocation && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              marginTop: 2,
            }}
          >
            <MapPin size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.storageLocation}
            </span>
          </div>
        )}

        {/* フッター：価格 & 数量操作または購入昇格ボタン */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 8,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
            ¥{(item.price || 0).toLocaleString()}
          </span>

          {/* 所持グッズ：数量コントロール */}
          {!item.isWish && !item.isPreorder && onUpdateQuantity && (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => onUpdateQuantity(e, item, -1)}
                aria-label="数量を減らす"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                -
              </button>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  minWidth: 16,
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                {item.quantity || 1}
              </span>
              <button
                type="button"
                onClick={(e) => onUpdateQuantity(e, item, 1)}
                aria-label="数量を増やす"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          )}

          {/* 欲しいもの・予約中：所持へ昇格ボタン */}
          {(item.isWish || item.isPreorder) && onMoveToOwned && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveToOwned(item);
              }}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: item.isPreorder ? '#8B5CF6' : 'var(--oshi-color)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {item.isPreorder ? '届いた' : '買った'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
