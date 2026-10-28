import React, { useRef } from 'react';
import {
  Camera,
  CheckCircle2,
  Edit2,
  MapPin,
  Package,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { GOODS_CATEGORY_META, GOODS_OPEN_STATUS_META, type Goods } from '../../types';

interface GoodsDetailInspectorProps {
  item: Goods | null;
  onClose?: () => void;
  onEdit: (item: Goods) => void;
  onDelete?: (item: Goods) => void;
  onToggleFavorite: (e: React.MouseEvent, item: Goods) => void;
  onMoveToOwned: (item: Goods) => void;
  onUpdateQuantity: (e: React.MouseEvent, item: Goods, delta: number) => void;
  onImageFileSelect: (item: Goods, file: File) => void;
  isMobileModal?: boolean;
}

export const GoodsDetailInspector: React.FC<GoodsDetailInspectorProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onMoveToOwned,
  onUpdateQuantity,
  onImageFileSelect,
  isMobileModal = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!item) {
    return (
      <div
        style={{
          height: '100%',
          minHeight: 380,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 20,
          border: '1px dashed var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-muted)',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: 'var(--bg-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Package size={26} strokeWidth={1.5} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            グッズを選んでください
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            グッズをタップすると、ここに詳しい情報が表示されます
          </div>
        </div>
      </div>
    );
  }

  const categoryInfo = GOODS_CATEGORY_META[item.category] || GOODS_CATEGORY_META.other;
  const statusInfo = GOODS_OPEN_STATUS_META[item.openStatus] || GOODS_OPEN_STATUS_META.storage;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageFileSelect(item, file);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: isMobileModal ? 20 : 20,
        border: isMobileModal ? 'none' : '1px solid var(--border-subtle)',
        boxShadow: isMobileModal ? 'none' : 'var(--shadow-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* ヘッダーバー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
          {item.isWish ? '欲しいもの詳細' : item.isPreorder ? '予約・注文詳細' : 'グッズ詳細'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* お気に入り切り替えボタン */}
          <button
            type="button"
            onClick={(e) => onToggleFavorite(e, item)}
            aria-label={item.isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              backgroundColor: item.isFavorite ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface-subtle)',
              color: item.isFavorite ? '#F59E0B' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* モーダル時のみ閉じるボタン */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
        {/* 画像エリア */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: 14,
            backgroundColor: 'var(--bg-surface-subtle)',
            overflow: 'hidden',
            marginBottom: 14,
            border: '1px solid var(--border-subtle)',
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: 'var(--bg-canvas)',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: 'var(--text-muted)',
              }}
            >
              <Package size={44} strokeWidth={1.2} />
              <span style={{ fontSize: 12 }}>写真がまだありません</span>
            </div>
          )}

          {/* 画像変更ボタン */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              padding: '6px 10px',
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.72)',
              color: '#FFFFFF',
              border: 'none',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Camera size={13} />
            <span>{item.image ? '変更' : '写真を追加'}</span>
          </button>
        </div>

        {/* タイトル & 価格 */}
        <div style={{ marginBottom: 14 }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: 'var(--text-primary)',
              lineHeight: 1.35,
              margin: '0 0 6px 0',
            }}
          >
            {item.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
              ¥{(item.price || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {item.isWish ? '(予算目安)' : '(税込)'}
            </span>
          </div>
        </div>

        {/* メタデータリスト */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 12,
            backgroundColor: 'var(--bg-surface-subtle)',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>カテゴリ</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                padding: '2px 8px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              {categoryInfo.label}
            </span>
          </div>

          {!item.isWish && !item.isPreorder && (
            <>
              {/* 所持数 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>持っている数</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    onClick={(e) => onUpdateQuantity(e, item, -1)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      minWidth: 24,
                      textAlign: 'center',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.quantity || 1}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => onUpdateQuantity(e, item, 1)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 状態 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>状態</span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: statusInfo.color,
                    color: '#FFFFFF',
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>

              {/* 保管場所 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>保管場所</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <MapPin size={12} />
                  {item.storageLocation || '未設定'}
                </span>
              </div>
            </>
          )}

          {item.purchaseDate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>購入日・お迎え日</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {item.purchaseDate.replace(/-/g, '/')}
              </span>
            </div>
          )}
        </div>

        {/* メモ */}
        {item.memo && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              backgroundColor: 'var(--bg-surface-subtle)',
              fontSize: 12.5,
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              marginBottom: 16,
              wordBreak: 'break-word',
            }}
          >
            {item.memo}
          </div>
        )}

        {/* アクションボタン */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(item.isWish || item.isPreorder) && (
            <button
              type="button"
              onClick={() => onMoveToOwned(item)}
              className="btn-primary"
              style={{
                width: '100%',
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{item.isPreorder ? '届いた！（コレクションへ）' : '購入した！（コレクションへ）'}</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="btn-sm"
              style={{
                flex: 1,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 700,
                fontSize: 12.5,
              }}
            >
              <Edit2 size={14} />
              <span>編集する</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                aria-label="削除"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'transparent',
                  color: '#EF4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
