import React from 'react';
import { Modal } from '../common/Modal';
import {
  ShieldCheck,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  EyeOff,
  Smartphone,
  HardDrive,
  Check,
  CheckCircle2,
} from 'lucide-react';

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
      title={isFirstTime ? 'サービス利用規約およびデータプライバシーポリシー' : '利用規約およびデータプライバシーポリシー'}
      maxWidth="md"
    >
      <div className="py-1 space-y-4 text-neutral-800 dark:text-neutral-200 max-h-[75vh] overflow-y-auto pr-1">
        {/* Intro */}
        <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--border-subtle)] flex items-start gap-3">
          <FileText className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            本サービスは、ユーザーのデータ主権および高度なプライバシー保護を実現するため、完全クライアントサイド完結型（ローカルファースト）アーキテクチャを採用しております。サービスのご利用にあたり、以下のデータ保持ポリシーおよび利用条件をご確認ください。
          </p>
        </div>

        {/* 4つのデータ保持・運用方針 */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 px-0.5">
            <span>データ保持および運用基本方針</span>
          </h4>

          {/* Point 1 */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h5 className="font-bold text-neutral-950 dark:text-white">
                1. クライアントサイド完全保持（サーバー送信ゼロ）
              </h5>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                登録された推し、イベント、グッズ、画像等の全データは、利用者の端末内（IndexedDB）に安全に保存されます。運営側サーバーへの送信、収集、第三者への提供は一切行われません。
              </p>
            </div>
          </div>

          {/* Point 2 */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h5 className="font-bold text-neutral-950 dark:text-white">
                2. アカウントレス・完全無償提供
              </h5>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                会員登録、個人情報（氏名、メールアドレス等）の取得、課金処理は一切不要です。全機能を制限なく無償でご利用いただけます。
              </p>
            </div>
          </div>

          {/* Point 3 */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Download className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h5 className="font-bold text-amber-950 dark:text-amber-200">
                3. バックアップ管理責任（重要事項）
              </h5>
              <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed text-[11px]">
                本サービスはクラウド同期サーバーを介さないため、端末の紛失・破損、ブラウザストレージの消去に伴うデータ消失のリスクはお客様自身の管理責任となります。「データエクスポート (JSON)」機能を活用し、定期的な外部バックアップの取得を推奨いたします。
              </p>
            </div>
          </div>

          {/* Point 4 */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 text-xs w-full">
              <h5 className="font-bold text-neutral-950 dark:text-white">
                4. P2P（Peer-to-Peer）直接暗号化同期
              </h5>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                一時的な認証コードを用いたデバイス間データ移行機能は、WebRTC技術を利用した端末間ダイレクト暗号化通信により実行されます。
              </p>
              <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-[var(--border-subtle)]">
                <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  ※ 中継サーバーにデータ内容が保持・蓄積されることはありません。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* システム利用上の留意点 */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
          <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 px-0.5">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-500" />
            <span>システム利用上の留意点</span>
          </h4>

          <div className="space-y-2 text-[11px]">
            {/* Note 1: プライベートモード */}
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border-subtle)] flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h6 className="font-bold text-neutral-900 dark:text-white text-xs">
                  プライベートブラウズ（シークレットモード）の制限
                </h6>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  シークレットモードで利用した場合、ブラウザの仕様によりセッション終了時に保存データが自動破棄されます。恒久的なデータ保持のため、通常のブラウジング環境でご利用ください。
                </p>
              </div>
            </div>

            {/* Note 2: ブラウザの履歴・データ消去 */}
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border-subtle)] flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h6 className="font-bold text-neutral-900 dark:text-white text-xs">
                  ブラウザキャッシュ・ストレージ消去時の注意事項
                </h6>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  端末の設定またはブラウザから「履歴およびウェブサイトデータの消去」を実行すると、本サービスのローカルデータベースも消去されます。消去前に必ずデータエクスポートを実施してください。
                </p>
              </div>
            </div>

            {/* Note 3: ホーム画面に追加（PWA） */}
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border-subtle)] flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h6 className="font-bold text-neutral-900 dark:text-white text-xs">
                  PWA（Progressive Web App）としてのインストール
                </h6>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  ブラウザメニューから「ホーム画面に追加」を実行することで、独立したウェブアプリケーションとしてオフライン環境下でも安定して動作します。
                </p>
              </div>
            </div>

            {/* Note 4: デバイス変更時の移行 */}
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border-subtle)] flex items-start gap-2.5">
              <RefreshCw className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h6 className="font-bold text-neutral-900 dark:text-white text-xs">
                  端末変更時のデータ移行手順
                </h6>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  端末移行時は、旧端末からエクスポートしたJSONファイルを新端末へ転送して「データインポート」を実行するか、または「デバイス間直接同期」機能をご利用ください。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>{isFirstTime ? '同意して利用を開始する' : '閉じる'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
