import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { GoodsCard } from './GoodsCard';
import type { Goods, Oshi } from '../../types';

interface GoodsStorageTabProps {
  goods: Goods[];
  oshis: Oshi[];
  selectedItem: Goods | null;
  onSelectItem: (item: Goods) => void;
  onToggleFavorite: (e: React.MouseEvent, item: Goods) => void;
  onUpdateQuantity: (e: React.MouseEvent, item: Goods, delta: number) => void;
  onOpenAddGoods: () => void;
  themeColor: string;
}

export const GoodsStorageTab: React.FC<GoodsStorageTabProps> = ({
  goods,
  oshis,
  selectedItem,
  onSelectItem,
  onToggleFavorite,
  onUpdateQuantity,
  themeColor,
}) => {
  // 所持グッズのみ対象
  const ownedGoods = useMemo(
    () => goods.filter((g) => !g.isWish && !g.isPreorder),
    [goods]
  );

  // 保管場所ごとにグループ化
  const groupedByLocation = useMemo(() => {
    const map = new Map<string, Goods[]>();

    ownedGoods.forEach((item) => {
      const loc = item.storageLocation?.trim() || '未設定（場所未登録）';
      if (!map.has(loc)) {
        map.set(loc, []);
      }
      map.get(loc)!.push(item);
    });

    // 配列化し、アイテム数順（未設定は最後）にソート
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0].startsWith('未設定')) return 1;
      if (b[0].startsWith('未設定')) return -1;
      return b[1].length - a[1].length;
    });
  }, [ownedGoods]);

  // アコーディオン開閉状態（デフォルトですべて開く）
  const [collapsedLocations, setCollapsedLocations] = useState<Record<string, boolean>>({});

  const toggleCollapse = (location: string) => {
    setCollapsedLocations((prev) => ({
      ...prev,
      [location]: !prev[location],
    }));
  };

  if (ownedGoods.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 18,
          border: '1px solid var(--border-subtle)',
          padding: '48px 20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: 'var(--bg-surface-subtle)',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <MapPin size={24} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          グッズがまだありません
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          グッズ登録時に「保管場所」を設定すると、場所ごとに整理・一覧できます
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 概要カード */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: `${themeColor}18`,
              color: themeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              保管場所マップ
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
              全 {groupedByLocation.length} か所の保管場所を管理中
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
            {ownedGoods.length}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginLeft: 3 }}>
            アイテム
          </span>
        </div>
      </div>

      {/* 場所ごとのセクションリスト */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groupedByLocation.map(([locationName, items]) => {
          const isCollapsed = collapsedLocations[locationName] === true;
          const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
          const totalPrice = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
          const isUnassigned = locationName.startsWith('未設定');

          return (
            <div
              key={locationName}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 16,
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {/* セクションヘッダー */}
              <div
                onClick={() => toggleCollapse(locationName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: isUnassigned ? 'var(--bg-surface-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <MapPin
                    size={16}
                    style={{
                      color: isUnassigned ? 'var(--text-muted)' : themeColor,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {locationName}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: 10,
                          backgroundColor: 'var(--bg-surface-subtle)',
                          color: 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        {items.length} 種 / {totalQty} 点
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    ¥{totalPrice.toLocaleString()}
                  </span>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                  </div>
                </div>
              </div>

              {/* アイテムグリッド */}
              {!isCollapsed && (
                <div
                  style={{
                    padding: 12,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 10,
                  }}
                >
                  {items.map((item) => {
                    const oshi = oshis.find((o) => o.id === item.oshiId);
                    return (
                      <GoodsCard
                        key={item.id}
                        item={item}
                        oshiName={oshi?.name}
                        oshiColor={oshi?.color}
                        isSelected={selectedItem?.id === item.id}
                        viewMode="grid"
                        onClick={() => onSelectItem(item)}
                        onToggleFavorite={onToggleFavorite}
                        onUpdateQuantity={onUpdateQuantity}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
