import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Palette,
  Plus,
  Calendar,
  CheckSquare,
  ShoppingBag,
  CreditCard,
  Database,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { useDialog } from '../../hooks/useDialog';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  themeColor: string;
  isDark?: boolean;
}

interface TutorialStep {
  stepNumber: string;
  badge: string;
  title: string;
  headline: string;
  description: string;
  icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
  highlights: { label: string; text: string; icon: React.FC<{ size?: number; color?: string }> }[];
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  themeColor,
  isDark = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const steps: TutorialStep[] = [
    {
      stepNumber: '1',
      badge: 'ようこそ',
      title: '推しサポへようこそ！',
      headline: '推し活を一元管理できるプライベート空間',
      description:
        '予定・TODO・グッズ・推し活支出のすべてをこのアプリひとつに集約。データはお使いの端末（ブラウザ）内にのみ安全に保存され、外部サーバーに送信・蓄積されることはありません。',
      icon: Heart,
      highlights: [
        {
          label: 'プライベート保存',
          text: '会員登録不要・端末ローカル完結でプライバシーも安心',
          icon: ShieldCheck,
        },
        {
          label: 'PWA対応',
          text: 'スマホの「ホーム画面に追加」でネイティブアプリ同様に使えます',
          icon: Smartphone,
        },
      ],
    },
    {
      stepNumber: '2',
      badge: 'Step 1',
      title: '推しを登録＆テーマカラー設定',
      headline: 'あなただけの「推し色」にカスタマイズ',
      description:
        'マイページの「推しの登録」から推しの名前・推し始めた記念日・アイコン写真を登録できます。テーマカラーを選べば、アプリ全体のアクセントが推し色に染まります！',
      icon: Palette,
      highlights: [
        {
          label: '推しの登録',
          text: '推し始めてから何日目かが一目でわかる記念日カウンター付き',
          icon: Heart,
        },
        {
          label: '10色パレット',
          text: '赤・ピンク・青・紫・緑・黄などメンバーカラーに対応',
          icon: Palette,
        },
      ],
    },
    {
      stepNumber: '3',
      badge: 'Step 2',
      title: '予定・TODO・グッズ・支出を管理',
      headline: '中央の「＋」ボタンからサッと何でも追加',
      description:
        'ライブ・イベント・配信の予定、FC先行申し込みのTODO、購入したグッズ、そしてチケット代や遠征費などの「推し活支出」も漏れなく記録できます。',
      icon: Plus,
      highlights: [
        {
          label: 'スマート時間入力',
          text: 'テンキーで直感的に時間を入力できるキーパッドを搭載',
          icon: Calendar,
        },
        {
          label: 'グッズ・支出管理',
          text: '所持・予約・欲しいものリストと、費目別の推し活出費を集計',
          icon: CreditCard,
        },
      ],
    },
    {
      stepNumber: '4',
      badge: 'Step 3',
      title: 'データの保存と復元（バックアップ）',
      headline: '大切な推し活データをワンタップで守る',
      description:
        'マイページの「データの保存と復元」から、いつでも全データをJSONファイルとしてダウンロード保存・復元できます。機種変更や万が一の際も一瞬で元通りに復旧できます。',
      icon: Database,
      highlights: [
        {
          label: 'JSON書き出し',
          text: '推し・予定・TODO・グッズ・支出をまとめてファイル保存',
          icon: Database,
        },
        {
          label: 'いつでも復元',
          text: '保存したJSONを選択するだけで、安全に上書き復元可能',
          icon: CheckCircle2,
        },
      ],
    },
    {
      stepNumber: '5',
      badge: 'Ready',
      title: '準備完了！推し活をはじめよう',
      headline: '推しサポで、最高の推し活ライフを',
      description:
        'これで基本の準備はバッチリです！まずはマイページで推しを登録するか、中央の「＋」ボタンから予定やTODOを追加してみてください。',
      icon: Sparkles,
      highlights: [
        {
          label: 'いつでも見返せます',
          text: 'このチュートリアルは、マイページ下部からいつでも再確認できます',
          icon: Sparkles,
        },
      ],
    },
  ];

  // モーダルが開かれたら最初のステップにリセット
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // キーボードナビゲーション
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onComplete();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length, onComplete, onClose]);

  // スワイプ操作対応（スマートフォン用）
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0 && currentStepIndex < steps.length - 1) {
        // 次へ
        setCurrentStepIndex((prev) => prev + 1);
      } else if (diff > 0 && currentStepIndex > 0) {
        // 前へ
        setCurrentStepIndex((prev) => prev - 1);
      }
    }
    touchStartX.current = null;
  };

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        animation: 'fadeIn 0.2s ease',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div
        ref={modalRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 26,
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* トップバー: バッジ・プログレス・スキップボタン */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 0',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: themeColor,
              backgroundColor: `${themeColor}16`,
              padding: '3px 10px',
              borderRadius: 9999,
              letterSpacing: '0.04em',
            }}
          >
            {currentStep.badge} ({currentStepIndex + 1}/{steps.length})
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>スキップ</span>
            <X size={15} />
          </button>
        </div>

        {/* メインイラスト・アイコンカード */}
        <div
          style={{
            padding: '24px 20px 10px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 24,
              backgroundColor: `${themeColor}18`,
              border: `2px solid ${themeColor}33`,
              color: themeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 12px 28px ${themeColor}28`,
              marginBottom: 16,
              transition: 'all 0.3s ease',
            }}
          >
            <StepIcon size={38} strokeWidth={2.3} color={themeColor} />
          </div>

          <h2
            id="tutorial-title"
            style={{
              margin: '0 0 6px',
              fontSize: 19,
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {currentStep.title}
          </h2>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: themeColor,
              marginBottom: 12,
            }}
          >
            {currentStep.headline}
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              textAlign: 'left',
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid var(--border-subtle)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {currentStep.description}
          </p>

          {/* ハイライト項目 */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 12,
            }}
          >
            {currentStep.highlights.map((h, idx) => {
              const HIcon = h.icon;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 12,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      backgroundColor: `${themeColor}14`,
                      color: themeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <HIcon size={13} color={themeColor} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {h.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {h.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ドットインジケーター */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            padding: '10px 0 6px',
          }}
        >
          {steps.map((_, idx) => {
            const isActive = idx === currentStepIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                aria-label={`ステップ ${idx + 1}`}
                style={{
                  width: isActive ? 22 : 7,
                  height: 7,
                  borderRadius: 9999,
                  backgroundColor: isActive ? themeColor : 'var(--border-subtle)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              />
            );
          })}
        </div>

        {/* アクションフッター */}
        <div
          style={{
            padding: '12px 20px 20px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 14,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <ChevronLeft size={16} />
              <span>前へ</span>
            </button>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <button
            type="button"
            onClick={handleNext}
            style={{
              flex: 2,
              padding: '12px 18px',
              borderRadius: 14,
              border: 'none',
              backgroundColor: themeColor,
              color: '#FFFFFF',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: `0 4px 16px ${themeColor}44`,
              transition: 'transform 0.1s ease',
            }}
          >
            <span>{isLastStep ? '推しサポをはじめる' : '次へ'}</span>
            {!isLastStep && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};
