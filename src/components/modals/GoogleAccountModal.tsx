import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useApp } from '../../context/AppContext';
import { googleAuthRepository } from '../../repository';
import type { GoogleCloudBackupMetadata } from '../../types';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  RefreshCw,
  Calendar,
  Heart,
  Package,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    googleUser,
    unlinkGoogleAccount,
    saveToGoogleCloud,
    restoreFromGoogleCloud,
    toggleGoogleAutoSync,
    showToast,
  } = useApp();

  const [metadata, setMetadata] = useState<GoogleCloudBackupMetadata | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

  // Load cloud backup metadata when opened
  useEffect(() => {
    if (isOpen && googleUser) {
      const meta = googleAuthRepository.getCloudBackupMetadata(googleUser.id);
      setMetadata(meta);
    }
  }, [isOpen, googleUser]);

  if (!googleUser) return null;

  const handleManualBackup = async () => {
    setIsSaving(true);
    try {
      const newMeta = await saveToGoogleCloud();
      setMetadata(newMeta);
    } catch {
      showToast('クラウドバックアップの保存に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreFromGoogleCloud();
      setIsRestoreConfirmOpen(false);
      onClose();
    } catch {
      showToast('クラウドからの復元に失敗しました', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExecuteUnlink = async () => {
    await unlinkGoogleAccount();
    setIsUnlinkConfirmOpen(false);
    onClose();
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '未同期';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '未同期';
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(
      date.getHours()
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Googleアカウント連携" maxWidth="md">
        <div className="space-y-5 text-gray-800 dark:text-gray-100">
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#191b28] border border-gray-200 dark:border-[#2e3247] shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg">
                    {googleUser.name.slice(0, 1)}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#191b28] rounded-full" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {googleUser.name}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                    連携中
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {googleUser.email}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  連携日: {formatDateTime(googleUser.linkedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Cloud Storage Status */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1c2b] border border-gray-200/80 dark:border-[#2b2f44] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-500" />
                <span>Googleクラウド保管状況</span>
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                前回保存: {formatDateTime(googleUser.lastSyncedAt || metadata?.updatedAt)}
              </span>
            </div>

            {metadata ? (
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-white dark:bg-[#202334] border border-gray-200/70 dark:border-[#353950]">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-0.5">
                    <Heart className="w-2.5 h-2.5 text-pink-500" /> 推し
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                    {metadata.oshisCount}人
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#202334] border border-gray-200/70 dark:border-[#353950]">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-0.5">
                    <Calendar className="w-2.5 h-2.5 text-indigo-500" /> 予定
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                    {metadata.eventsCount}件
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#202334] border border-gray-200/70 dark:border-[#353950]">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-0.5">
                    <Package className="w-2.5 h-2.5 text-amber-500" /> グッズ
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                    {metadata.goodsCount}点
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#202334] border border-gray-200/70 dark:border-[#353950]">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-0.5">
                    <CheckSquare className="w-2.5 h-2.5 text-emerald-500" /> TODO
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                    {metadata.todosCount}件
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 py-1">
                クラウド上にまだバックアップがありません。「クラウドに最新バックアップを保存」を押して保存してください。
              </p>
            )}

            {/* Auto-Sync Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-[#2b2f44]">
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                  <span>自動同期（推奨）</span>
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  推しや予定を編集した際に自動でクラウドへ反映
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleGoogleAutoSync(!googleUser.autoSync)}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 relative ${
                  googleUser.autoSync ? 'bg-pink-500' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    googleUser.autoSync ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Cloud Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleManualBackup}
              disabled={isSaving}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>クラウドに保存中...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>クラウドに最新バックアップ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsRestoreConfirmOpen(true)}
              disabled={!metadata || isRestoring}
              className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-[#35384d] hover:bg-gray-50 dark:hover:bg-[#202334] text-gray-800 dark:text-gray-200 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>復元処理中...</span>
                </>
              ) : (
                <>
                  <CloudDownload className="w-4 h-4 text-blue-500" />
                  <span>クラウドからデータを復元</span>
                </>
              )}
            </button>
          </div>

          {/* Unlink Action */}
          <div className="pt-3 border-t border-gray-200 dark:border-[#2b2f44] flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              連携解除しても端末内のデータは消去されません
            </span>

            <button
              type="button"
              onClick={() => setIsUnlinkConfirmOpen(true)}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>連携を解除</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Unlink Modal */}
      <ConfirmModal
        isOpen={isUnlinkConfirmOpen}
        onClose={() => setIsUnlinkConfirmOpen(false)}
        onConfirm={handleExecuteUnlink}
        title="Googleアカウント連携の解除"
        message={`「${googleUser.name} (${googleUser.email})」との連携を解除してもよろしいですか？`}
        warningNote="※ 連携を解除しても、端末内の推し活データはそのまま保持されます。再度連携すると引き続きクラウド同期をご利用いただけます。"
        confirmLabel="連携を解除する"
        variant="warning"
      />

      {/* Confirm Restore Modal */}
      <ConfirmModal
        isOpen={isRestoreConfirmOpen}
        onClose={() => setIsRestoreConfirmOpen(false)}
        onConfirm={handleExecuteRestore}
        title="Googleクラウドから復元"
        message="Googleクラウドに保存されているバックアップデータを端末に復元します。"
        warningNote="※ 現在端末に入っているデータは、クラウドのデータで上書きされます。よろしいですか？"
        confirmLabel="上書きして復元する"
        variant="warning"
        isLoading={isRestoring}
      />
    </>
  );
};
