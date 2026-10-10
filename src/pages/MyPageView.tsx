import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { oshiRepository, backupRepository } from '../repository';
import type { Oshi } from '../types';
import { getDaysSince } from '../utils/helpers';
import {
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Database,
  Calendar,
  Package,
  RefreshCw,
  RotateCcw,
  Wrench,
  Eye,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { DeviceSyncModal } from '../components/modals/DeviceSyncModal';

interface MyPageViewProps {
  onOpenOshiModal: (targetOshi?: Oshi) => void;
  onOpenTermsModal?: () => void;
  onPreviewMaintenance?: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({
  onOpenOshiModal,
  onOpenTermsModal,
  onPreviewMaintenance,
}) => {
  const {
    oshis,
    events,
    goods,
    refreshAllData,
    showToast,
    recoverableBackup,
    restoreRecoverableBackup,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for modals
  const [oshiToDelete, setOshiToDelete] = useState<Oshi | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Handle Delete Oshi
  const handleDeleteOshi = async () => {
    if (!oshiToDelete) return;
    try {
      await oshiRepository.delete(oshiToDelete.id);
      await refreshAllData();
      showToast(`「${oshiToDelete.name}」を削除しました`, 'info');
      setOshiToDelete(null);
    } catch {
      showToast('削除に失敗しました', 'error');
    }
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    try {
      setIsProcessing(true);
      const fileName = await backupRepository.downloadBackupFile();
      showToast(`バックアップを保存しました: ${fileName}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('バックアップの保存に失敗しました', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger file selection for import
  const handleSelectImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setPendingImportData(parsed);
        setIsImportConfirmOpen(true);
      } catch {
        showToast('選んだファイルが正しくありません。保存したバックアップファイルをお選びください。', 'error');
      }
    };
    reader.onerror = () => {
      showToast('ファイルの読み込みに失敗しました', 'error');
    };
    reader.readAsText(file);

    // Reset input so user can choose same file again if needed
    e.target.value = '';
  };

  // Execute Import Backup after confirmation
  const handleExecuteImport = async () => {
    if (!pendingImportData) return;
    setIsProcessing(true);
    try {
      const stats = await backupRepository.importBackup(pendingImportData);
      await refreshAllData();
      setIsImportConfirmOpen(false);
      setPendingImportData(null);
      showToast(
        `復元が完了しました (推し:${stats.oshisCount}人, 予定:${stats.eventsCount}件, グッズ:${stats.goodsCount}点)`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : '復元に失敗しました', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Clear All Data after confirmation
  const handleExecuteClearAll = async () => {
    setIsProcessing(true);
    try {
      await backupRepository.clearAllData();
      await refreshAllData();
      setIsClearAllConfirmOpen(false);
      showToast('すべての推し活データを消去しました', 'info');
    } catch (err) {
      console.error(err);
      showToast('データの消去に失敗しました', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bento-card rounded-xl p-4 sm:p-5">
        <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white flex items-center gap-2">
          <span>マイページ</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          推しの管理、端末間データ同期・バックアップ
        </p>
      </div>

      {/* Recoverable Backup Recovery Banner */}
      {recoverableBackup && oshis.length === 0 && (
        <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-xs">
              <h4 className="font-bold text-amber-950 dark:text-amber-100">
                前回の推し活データが見つかりました！
              </h4>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                推し <strong>{recoverableBackup.data.oshis?.length || 0}人</strong>、予定 <strong>{recoverableBackup.data.events?.length || 0}件</strong>、グッズ <strong>{recoverableBackup.data.goods?.length || 0}点</strong> のデータを復元できます。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={restoreRecoverableBackup}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>前回のデータを復元</span>
          </button>
        </div>
      )}

      {/* SECTION 1: 推し一覧 */}
      <div className="bento-card rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-neutral-950 dark:text-white">推し一覧</h3>
            <span className="text-xs text-neutral-400 font-medium num-tabular">({oshis.length}人)</span>
          </div>

          <button
            onClick={() => onOpenOshiModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs shadow-xs active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>推しを追加</span>
          </button>
        </div>

        {oshis.length === 0 ? (
          <div className="text-center py-8 bg-black/[0.01] dark:bg-white/[0.01] rounded-lg border border-dashed border-[var(--border-subtle)] space-y-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">推しがまだ登録されていません</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onOpenOshiModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>推しを追加する</span>
              </button>
              {recoverableBackup && (
                <button
                  onClick={restoreRecoverableBackup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>前回のデータを復元</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {oshis.map((oshi) => {
              const daysSince = getDaysSince(oshi.debutDate);
              const relatedEventsCount = events.filter((e) => e.oshiId === oshi.id).length;
              const relatedGoodsCount = goods.filter((g) => g.oshiId === oshi.id).length;

              return (
                <div
                  key={oshi.id}
                  className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-muted)] transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[var(--border-subtle)] bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center font-bold text-sm"
                      style={{ color: oshi.color || 'var(--text-primary)' }}
                    >
                      {oshi.image ? (
                        <img src={oshi.image} alt={oshi.name} className="w-full h-full object-cover" />
                      ) : (
                        oshi.name.slice(0, 1)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {oshi.name}
                        </span>
                        {oshi.category && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 border border-[var(--border-subtle)]">
                            {oshi.category}
                          </span>
                        )}
                        {oshi.group && (
                          <span className="text-[10px] text-neutral-400 truncate">
                            ({oshi.group})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {daysSince > 0 && <span className="num-tabular">{daysSince}日目</span>}
                        <span className="flex items-center gap-0.5 num-tabular">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          {relatedEventsCount}
                        </span>
                        <span className="flex items-center gap-0.5 num-tabular">
                          <Package className="w-3 h-3 text-neutral-400" />
                          {relatedGoodsCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenOshiModal(oshi)}
                      className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                      title="編集"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setOshiToDelete(oshi)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-600 transition"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: データの保存・引き継ぎ */}
      <div className="bento-card rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-neutral-400" />
          <h3 className="font-bold text-sm text-neutral-950 dark:text-white">データの保存・引き継ぎ</h3>
        </div>

        {/* 端末保存ステータス */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">端末内に自動保存中</span>
            <span className="text-[11px] text-neutral-400">（サーバー送信なし・オフライン対応）</span>
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 num-tabular">
            推し <strong>{oshis.length}</strong> 人 · 予定 <strong>{events.length}</strong> 件 · グッズ <strong>{goods.length}</strong> 点
          </div>
        </div>

        {/* 控え復元（直近データ控えがある場合のみ表示） */}
        {recoverableBackup && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0 text-xs">
                <span className="font-bold text-amber-950 dark:text-amber-100 mr-2">直前の保存控え</span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                  （推し {recoverableBackup.data.oshis?.length || 0}人, 予定 {recoverableBackup.data.events?.length || 0}件, グッズ {recoverableBackup.data.goods?.length || 0}点）
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={restoreRecoverableBackup}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>データを復元</span>
            </button>
          </div>
        )}

        {/* 3つのアクション：同期・保存・復元 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 同期 */}
          <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                <RefreshCw className="w-4 h-4 text-neutral-500" />
                <span>端末同士で同期 (P2P)</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                6桁の認証コードでスマホ・PC間を直接データ移行
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>同期する</span>
            </button>
          </div>

          {/* 保存（エクスポート） */}
          <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                <Download className="w-4 h-4 text-neutral-500" />
                <span>バックアップ保存 (JSON)</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                全推し活データをファイルとして端末にダウンロード
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              disabled={isProcessing}
              className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>保存する</span>
            </button>
          </div>

          {/* 復元（インポート） */}
          <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                <Upload className="w-4 h-4 text-neutral-500" />
                <span>ファイルから復元</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                保存したバックアップファイルを読み込んで復元
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleSelectImportFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-2 px-3 rounded-lg border border-[var(--border-subtle)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-neutral-700 dark:text-neutral-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>ファイルを選択</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: データ消去 */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
          <span className="text-neutral-400 text-[11px]">端末内の推し活データをすべて初期化</span>
          <button
            onClick={() => setIsClearAllConfirmOpen(true)}
            disabled={isProcessing}
            className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium hover:underline inline-flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>すべてのデータを消去</span>
          </button>
        </div>
      </div>

      {/* Admin Maintenance (折りたたみ式) */}
      <details className="group rounded-xl border border-dashed border-[var(--border-subtle)] bg-black/[0.01] dark:bg-white/[0.01] p-3 text-xs">
        <summary className="cursor-pointer font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center justify-between list-none select-none">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Wrench className="w-3.5 h-3.5 text-neutral-400" />
            <span>運営・管理者用メニュー（メンテナンス切替）</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180 text-neutral-400" />
        </summary>
        <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] space-y-2 text-neutral-500 dark:text-neutral-400">
          <p className="text-[11px] leading-relaxed">
            GitHub Actionsから本番サイトのメンテナンスモードを切り替えられます。
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="https://github.com/toku0716/oshi_web/actions/workflows/maintenance.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Wrench className="w-3 h-3 text-neutral-400" />
              <span>GitHub Actions</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>

            {onPreviewMaintenance && (
              <button
                type="button"
                onClick={onPreviewMaintenance}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-neutral-700 dark:text-neutral-200 font-semibold text-xs transition inline-flex items-center gap-1.5"
              >
                <Eye className="w-3 h-3 text-neutral-400" />
                <span>メンテナンス画面プレビュー</span>
              </button>
            )}
          </div>
        </div>
      </details>

      {/* App Version & Info */}
      <div className="text-center text-xs text-neutral-400 pt-2 space-y-1.5">
        <p className="font-semibold text-neutral-500 dark:text-neutral-400">推しサポ Web版</p>
        <p className="text-[11px] text-neutral-400">
          端末内自動保存 ＆ バックアップ対応（完全非公開）
        </p>
        {onOpenTermsModal && (
          <div>
            <button
              type="button"
              onClick={onOpenTermsModal}
              className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline font-medium hover:opacity-80 transition inline-block py-1"
            >
              安心機能と利用規約・プライバシーポリシー
            </button>
          </div>
        )}
      </div>

      {/* Confirm Modal: Delete Oshi */}
      <ConfirmModal
        isOpen={!!oshiToDelete}
        onClose={() => setOshiToDelete(null)}
        onConfirm={handleDeleteOshi}
        title="推しの削除"
        message={`「${oshiToDelete?.name}」を削除してもよろしいですか？`}
        warningNote="※ 関連付けられている予定やグッズの推し紐付けが解除されます。"
        confirmLabel="削除する"
        variant="danger"
      />

      {/* Confirm Modal: Import Backup Safety Check */}
      <ConfirmModal
        isOpen={isImportConfirmOpen}
        onClose={() => {
          setIsImportConfirmOpen(false);
          setPendingImportData(null);
        }}
        onConfirm={handleExecuteImport}
        title="バックアップから復元"
        message="選択したバックアップファイルを読み込みます。現在のデータに上書きしてもよろしいですか？"
        warningNote="※ 端末に現在入っている推し活データはバックアップの内容に置き換わります。"
        confirmLabel="上書きして復元"
        cancelLabel="キャンセル"
        variant="warning"
        isLoading={isProcessing}
      />

      {/* Confirm Modal: Clear All Data */}
      <ConfirmModal
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={handleExecuteClearAll}
        title="すべてのデータを消去"
        message="登録されている推し、予定、グッズの全データを完全に削除します。"
        warningNote="※ 一度削除したデータは元に戻せません。大切なデータがある場合は事前にバックアップをダウンロードしてください。"
        confirmLabel="完全に消去する"
        cancelLabel="キャンセル"
        variant="danger"
        isLoading={isProcessing}
      />

      {/* Device Sync Modal (6-Digit Code) */}
      <DeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
};
