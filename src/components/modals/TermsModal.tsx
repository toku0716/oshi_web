import React from 'react';
import { Modal } from '../common/Modal';
import { ShieldCheck, UserCheck, AlertTriangle, RefreshCw, Check } from 'lucide-react';

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
      title={isFirstTime ? '推しサポへようこそ！' : '利用規約・機能について'}
      maxWidth="md"
    >
      <div className="py-1 space-y-4 text-gray-800 dark:text-gray-200">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          推しサポを安心・安全にご利用いただくための機能とお約束です。
        </p>

        <div className="space-y-3">
          {/* Point 1: データの保存 */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202438] border border-gray-200 dark:border-[#383e5e] shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-gray-900 dark:text-white text-xs">
                1. データはあなたの端末だけに保存（安全・非公開）
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
                登録した推し、予定、グッズ、写真などのデータはお使いのスマホやパソコンの中にのみ自動保存されます。データがサーバーに保存されたり、第三者に公開・共有されることは一切ありません。
              </p>
            </div>
          </div>

          {/* Point 2: 無料・ログイン不要 */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202438] border border-gray-200 dark:border-[#383e5e] shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-gray-900 dark:text-white text-xs">
                2. 登録不要・完全無料
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
                会員登録やログイン、課金は一切ありません。すべての機能を完全無料でご利用いただけます。
              </p>
            </div>
          </div>

          {/* Point 3: バックアップのお願い */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-[#2c2618] border border-amber-300/80 dark:border-amber-600/60 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-amber-950 dark:text-amber-300 text-xs">
                3. バックアップのお願い（大切なお約束）
              </h4>
              <p className="text-amber-900 dark:text-amber-100 leading-relaxed text-[11px]">
                ブラウザのCookieや履歴を全消去したり端末が故障した場合、データが消えてしまいます。マイページの「バックアップをダウンロード」から、定期的に控えを保存してください。
              </p>
            </div>
          </div>

          {/* Point 4: 端末間同期 */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202438] border border-gray-200 dark:border-[#383e5e] shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 shrink-0 mt-0.5">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 text-xs w-full">
              <h4 className="font-bold text-gray-900 dark:text-white text-xs">
                4. 端末同士のデータ直接同期
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
                画面に出る6桁の番号を入力するだけで、パソコンとスマホの間でデータを引き継ぐことができます。
              </p>
              <div className="p-2 rounded-lg bg-indigo-50/90 dark:bg-[#181d33] border border-indigo-200/90 dark:border-indigo-500/40">
                <p className="text-indigo-950 dark:text-indigo-200 leading-relaxed text-[10.5px] font-medium">
                  ※ 本アプリは、ユーザー自身の端末間でのみデータを直接同期する仕様です。データがサーバーに保存されたり、第三者に公開・共有されたりすることは一切ありません。
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
            className="w-full py-2.5 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>{isFirstTime ? '確認して利用を開始する' : '閉じる'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
