import React, { useState } from 'react';
import { Star, Send, CheckCircle2, MessageSquare, X, Smartphone, Monitor, Tablet, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDialog } from '../../hooks/useDialog';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_OPTIONS = [
  '推しの登録・記念日カウント',
  'ライブ・イベント予定管理',
  'TODO・持ち物チェックリスト',
  'グッズ管理（写真・保管場所・ステータス）',
  '推し活支出管理',
  'テーマカラー・ダークモード',
  'スマホ・PC間データ同期',
];

export const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose }) => {
  const { themeColor, showToast } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [device, setDevice] = useState<'smartphone' | 'pc' | 'tablet' | 'other'>('smartphone');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['推しの登録・記念日カウント']);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handleToggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const surveyResponse = {
      submittedAt: new Date().toISOString(),
      rating,
      device,
      features: selectedFeatures,
      feedback: feedback.trim(),
    };

    try {
      const existingStr = localStorage.getItem('oshiss_survey_responses');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.push(surveyResponse);
      localStorage.setItem('oshiss_survey_responses', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setIsSubmitted(true);
    showToast('アンケートへのご協力ありがとうございます！✨', 'success');
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setRating(5);
    setFeedback('');
    onClose();
  };

  return (
    <div className="flutter-sheet-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-title"
        className="flutter-sheet"
        style={{
          maxWidth: 540,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: 24,
          padding: 0,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-elevation-high)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${themeColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColor,
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 id="survey-title" style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                推しサポ アンケート
              </h2>
              <p style={{ fontSize: 11.5, margin: 0, color: 'var(--text-muted)' }}>
                皆様の声をもとにアプリをより良く改善します
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="閉じる"
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: `${themeColor}20`,
                  color: themeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                送信が完了しました！
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
                貴重なご意見・ご要望をいただき、誠にありがとうございます。
                <br />
                いただいた内容は開発チームで大切に拝見し、今後の機能向上・UI改善に役立たせていただきます。
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  padding: '10px 28px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: themeColor,
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                閉じる
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 質問1: 満足度 */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                  1. アプリの総合満足度をお聞かせください
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating ?? rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 4,
                          cursor: 'pointer',
                          display: 'flex',
                          transition: 'transform 0.15s ease',
                        }}
                        aria-label={`${star}点`}
                      >
                        <Star
                          size={28}
                          color={active ? '#FFB800' : 'var(--text-muted)'}
                          fill={active ? '#FFB800' : 'none'}
                          strokeWidth={2}
                        />
                      </button>
                    );
                  })}
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginLeft: 8 }}>
                    {rating === 5 && 'とても満足 ✨'}
                    {rating === 4 && '満足 😊'}
                    {rating === 3 && '普通 😐'}
                    {rating === 2 && 'やや不満 🙁'}
                    {rating === 1 && '改善を希望 😢'}
                  </span>
                </div>
              </div>

              {/* 質問2: 主な利用デバイス */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                  2. 主にどのデバイスで利用していますか？
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { key: 'smartphone', label: 'スマホ', icon: <Smartphone size={16} /> },
                    { key: 'pc', label: 'パソコン', icon: <Monitor size={16} /> },
                    { key: 'tablet', label: 'タブレット', icon: <Tablet size={16} /> },
                  ].map((dev) => {
                    const isSelected = device === dev.key;
                    return (
                      <button
                        key={dev.key}
                        type="button"
                        onClick={() => setDevice(dev.key as any)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 12,
                          border: `1.5px solid ${isSelected ? themeColor : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? `${themeColor}15` : 'var(--bg-surface)',
                          color: isSelected ? themeColor : 'var(--text-secondary)',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {dev.icon}
                        <span>{dev.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 質問3: よく使う機能 */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                  3. 特によく使っている機能（複数選択可）
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FEATURE_OPTIONS.map((feat) => {
                    const isSelected = selectedFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => handleToggleFeature(feat)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 9999,
                          border: `1.2px solid ${isSelected ? themeColor : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? `${themeColor}20` : 'var(--bg-surface)',
                          color: isSelected ? themeColor : 'var(--text-secondary)',
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected && <Heart size={12} fill={themeColor} color={themeColor} />}
                        <span>{feat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 質問4: ご意見・改善要望 */}
              <div>
                <label htmlFor="survey-feedback" style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                  4. ご意見・改善要望・欲しい新機能など
                </label>
                <textarea
                  id="survey-feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="例: グッズの検索機能を強化してほしい、通知機能があると嬉しい、など自由にご記入ください"
                  rows={4}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  borderRadius: 14,
                  border: 'none',
                  backgroundColor: themeColor,
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4,
                  boxShadow: `0 4px 14px ${themeColor}40`,
                }}
              >
                <Send size={16} />
                <span>アンケートを送信する</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
