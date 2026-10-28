import React, { useMemo } from 'react';
import {
  Award,
  Layers,
  PieChart,
  ShoppingBag,
  Star,
  Tag,
  TrendingUp,
} from 'lucide-react';
import {
  GOODS_CATEGORY_META,
  GOODS_OPEN_STATUS_META,
  type Goods,
  type GoodsCategory,
  type GoodsOpenStatus,
  type Oshi,
} from '../../types';

interface GoodsAnalyticsTabProps {
  goods: Goods[];
  oshis: Oshi[];
  themeColor: string;
}

export const GoodsAnalyticsTab: React.FC<GoodsAnalyticsTabProps> = ({
  goods,
  oshis,
  themeColor,
}) => {
  // 所持グッズのみ対象
  const ownedItems = useMemo(
    () => goods.filter((g) => !g.isWish && !g.isPreorder),
    [goods]
  );

  const totalCount = useMemo(
    () => ownedItems.reduce((sum, g) => sum + (g.quantity || 1), 0),
    [ownedItems]
  );

  const totalPrice = useMemo(
    () => ownedItems.reduce((sum, g) => sum + (g.price || 0) * (g.quantity || 1), 0),
    [ownedItems]
  );

  const avgPrice = totalCount > 0 ? Math.round(totalPrice / totalCount) : 0;

  const favoriteItems = useMemo(
    () => ownedItems.filter((g) => g.isFavorite),
    [ownedItems]
  );
  const favoritePrice = useMemo(
    () => favoriteItems.reduce((sum, g) => sum + (g.price || 0) * (g.quantity || 1), 0),
    [favoriteItems]
  );

  // カテゴリ別集計
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; price: number }> = {};
    ownedItems.forEach((g) => {
      const cat = g.category || 'other';
      if (!map[cat]) map[cat] = { count: 0, price: 0 };
      const qty = g.quantity || 1;
      map[cat].count += qty;
      map[cat].price += (g.price || 0) * qty;
    });

    return Object.entries(map)
      .map(([cat, stat]) => ({
        cat: cat as GoodsCategory,
        label: GOODS_CATEGORY_META[cat as GoodsCategory]?.label || cat,
        count: stat.count,
        price: stat.price,
        percent: totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.price - a.price);
  }, [ownedItems, totalCount]);

  // 開封状況別集計
  const openStatusStats = useMemo(() => {
    const map: Record<string, number> = {};
    ownedItems.forEach((g) => {
      const st = g.openStatus || 'unopened';
      const qty = g.quantity || 1;
      map[st] = (map[st] || 0) + qty;
    });

    return Object.entries(map).map(([st, count]) => ({
      status: st as GoodsOpenStatus,
      label: GOODS_OPEN_STATUS_META[st as GoodsOpenStatus]?.label || st,
      color: GOODS_OPEN_STATUS_META[st as GoodsOpenStatus]?.color || '#94A3B8',
      count,
      percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    }));
  }, [ownedItems, totalCount]);

  // 推し別集計 (複数推しがいる場合)
  const oshiStats = useMemo(() => {
    if (oshis.length <= 1) return [];
    const map: Record<string, { count: number; price: number; name: string; color?: string }> = {};

    ownedItems.forEach((g) => {
      const oshi = oshis.find((o) => o.id === g.oshiId);
      const oshiId = oshi ? oshi.id : 'unknown';
      const oshiName = oshi ? oshi.name : '推し指定なし';
      const oshiColor = oshi?.color || themeColor;

      if (!map[oshiId]) {
        map[oshiId] = { count: 0, price: 0, name: oshiName, color: oshiColor };
      }
      const qty = g.quantity || 1;
      map[oshiId].count += qty;
      map[oshiId].price += (g.price || 0) * qty;
    });

    return Object.values(map).sort((a, b) => b.price - a.price);
  }, [ownedItems, oshis, themeColor]);

  if (ownedItems.length === 0) {
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
          <PieChart size={24} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          分析データがまだありません
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          グッズを登録すると、使った合計金額やカテゴリ別の内訳が自動でまとまります
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPIサマリーグリッド */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: 10,
        }}
      >
        {/* 総投資額 */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>
            <TrendingUp size={14} color={themeColor} />
            <span>使った合計金額</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            ¥{totalPrice.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
            あつめたグッズの合計
          </div>
        </div>

        {/* 総アイテム数 */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>
            <ShoppingBag size={14} color={themeColor} />
            <span>持っている数</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            {totalCount} <span style={{ fontSize: 12, fontWeight: 700 }}>点</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
            全 {ownedItems.length} 種類
          </div>
        </div>

        {/* 平均単価 */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>
            <Tag size={14} color={themeColor} />
            <span>1つあたりの平均</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            ¥{avgPrice.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
            平均の価格
          </div>
        </div>

        {/* お気に入り */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>
            <Star size={14} fill="#F59E0B" />
            <span>お気に入り</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            {favoriteItems.length} <span style={{ fontSize: 12, fontWeight: 700 }}>点</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
            ¥{favoritePrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* カテゴリ別内訳 */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 18,
          border: '1px solid var(--border-subtle)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <PieChart size={17} color={themeColor} />
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            カテゴリ別の内訳
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {categoryStats.map((item) => (
            <div key={item.cat} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {item.count}点 ({item.percent}%)
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                    ¥{item.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* プログレスバー */}
              <div
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'var(--bg-surface-subtle)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${item.percent}%`,
                    height: '100%',
                    backgroundColor: themeColor,
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 保存・開封状態別シェア */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 18,
          border: '1px solid var(--border-subtle)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Layers size={17} color={themeColor} />
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            開封・保管の状態
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
          }}
        >
          {openStatusStats.map((st) => (
            <div
              key={st.status}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                backgroundColor: 'var(--bg-surface-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: st.color,
                  }}
                />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {st.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)' }}>
                  {st.count} 点
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                  {st.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 推し別投資比率 (推しが複数いる場合) */}
      {oshiStats.length > 1 && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 18,
            border: '1px solid var(--border-subtle)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Award size={17} color={themeColor} />
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              推しごとの割合
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {oshiStats.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 10,
                  backgroundColor: 'var(--bg-surface-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: item.color || themeColor,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {item.count}点
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                    ¥{item.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
