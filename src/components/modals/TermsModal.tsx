import React from 'react';
import { Modal } from '../common/Modal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void;
  isFirstTime?: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAgree,
  isFirstTime = false,
}) => {
  const handleConfirm = () => {
    if (onAgree) onAgree();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="利用規約・データ保存ポリシー"
    >
      <div>
        <p>
          本アプリは<strong>ZEN大学の生徒のみなさまを対象</strong>として提供されています。推しの記念日・現場スケジュール・当落管理・所持グッズ・参戦準備TODOを一元管理できるWebアプリです。今後の機能改善・アップデートのため、利用者の皆様からのフィードバックへのご協力をお願いいたします。
        </p>

        <h4>データ保存と運用の基本方針</h4>
        <ul>
          <li>
            <strong>1. 対象者とフィードバック</strong>:{' '}
            ZEN大学の生徒限定で提供しています。今後のサービス向上のため、ご意見・ご感想等のフィードバックにご協力をお願いいたします。
          </li>
          <li>
            <strong>2. 端末内への完全ローカル保存（外部送信ゼロ）</strong>:{' '}
            登録した推し・予定・グッズ金額・写真などの全データは、お使いの端末内（IndexedDB）にのみ保存されます。
          </li>
          <li>
            <strong>3. アカウント登録不要・Googleログイン時の限定利用</strong>:{' '}
            通常利用時は会員登録や個人情報の入力は不要です。アクセス制限機能によるGoogleログイン時も、本人認証およびログイン状態の表示のみに利用し、広告配信や外部第三者への提供・共有は一切行いません。
          </li>
          <li>
            <strong>4. バックアップのお願い</strong>:{' '}
            ブラウザのデータ消去や端末故障に備え、JSONバックアップの定期保存を推奨します。
          </li>
          <li>
            <strong>5. 端末間のデータ引き継ぎ</strong>:{' '}
            端末間P2P同期またはJSONバックアップからの復元をご利用いただけます。
          </li>
        </ul>

        <div>
          <button type="button" onClick={handleConfirm}>
            {isFirstTime ? '同意して利用を開始する' : '閉じる'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
