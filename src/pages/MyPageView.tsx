import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { oshiRepository, backupRepository } from '../repository';
import type { Oshi } from '../types';
import { getDaysSince } from '../utils/helpers';
import {
  User,
  Heart,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Database,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  RotateCcw,
  Wrench,
  Eye,
  ExternalLink,
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
    restoreSampleData,
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
      showToast(`バックアップファイル「${fileName}」を保存しました`, 'success');
    } catch (err) {
      console.error(err);
      showToast('バックアップファイルの作成に失敗しました', 'error');
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
        showToast('選んだファイルが正しくありません。バックアップファイル（.json）をご確認ください。', 'error');
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
      showToast('すべてのデータを消去しました', 'info');
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
      <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-pink-500" />
          <span>マイページ</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          登録した推しの管理や、端末へのデータ保存・バックアップを行います。
        </p>
      </div>

      {/* Recoverable Backup Recovery Banner */}
      {recoverableBackup && oshis.length === 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-600/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-amber-950 dark:text-amber-100">
                  直前の保存控えが見つかりました！
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  復元可能
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                推し <strong>{recoverableBackup.data.oshis?.length || 0}人</strong>、予定 <strong>{recoverableBackup.data.events?.length || 0}件</strong>、グッズ <strong>{recoverableBackup.data.goods?.length || 0}点</strong> のデータをワンクリックで元通りに復元できます。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={restoreRecoverableBackup}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>直近データを復元する</span>
          </button>
        </div>
      )}

      {/* SECTION 1: 推し管理 */}
      <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">推し一覧・管理</h3>
            <span className="text-xs text-gray-400">({oshis.length}人)</span>
          </div>

          <button
            onClick={() => onOpenOshiModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>推しを追加</span>
          </button>
        </div>

        {oshis.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-[#1c1d29] rounded-lg border border-dashed border-gray-200 dark:border-[#35384d] space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">推しがまだ登録されていません</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onOpenOshiModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition"
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
            <div className="pt-1">
              <button
                onClick={restoreSampleData}
                className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
              >
                初期サンプルデータを読み込む
              </button>
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
                  className="p-3.5 rounded-lg border border-gray-200 dark:border-[#262838] bg-white dark:bg-[#191a26] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-[#35384d] bg-gray-100 dark:bg-[#222434] flex items-center justify-center font-bold text-sm"
                      style={{ color: oshi.color || '#ec4899' }}
                    >
                      {oshi.image ? (
                        <img src={oshi.image} alt={oshi.name} className="w-full h-full object-cover" />
                      ) : (
                        oshi.name.slice(0, 1)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {oshi.name}
                        </span>
                        {oshi.category && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-900/40">
                            {oshi.category}
                          </span>
                        )}
                        {oshi.group && (
                          <span className="text-[10px] text-gray-400 truncate">
                            ({oshi.group})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {daysSince > 0 && <span>{daysSince}日目</span>}
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {relatedEventsCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Package className="w-3 h-3 text-gray-400" />
                          {relatedGoodsCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenOshiModal(oshi)}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#252838] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                      title="編集"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setOshiToDelete(oshi)}
                      className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-600 transition"
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

      {/* SECTION 2: データの保存とバックアップ */}
      <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">データの保存とバックアップ</h3>
        </div>

        {/* Recoverable Backup Recovery Card in Section 2 */}
        {recoverableBackup && (
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-[#191b28] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-amber-950 dark:text-amber-100">
                    直前の保存控えが見つかりました
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    ワンクリック復元
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                  消えてしまった推し <strong>{recoverableBackup.data.oshis?.length || 0}人</strong>、予定 <strong>{recoverableBackup.data.events?.length || 0}件</strong>、グッズ <strong>{recoverableBackup.data.goods?.length || 0}点</strong> のデータを元通りに復元できます。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={restoreRecoverableBackup}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>データを復元する</span>
            </button>
          </div>
        )}

        {/* Local Storage Status Box */}
        <div className="p-3.5 rounded-lg border border-gray-200 dark:border-[#262838] bg-gray-50 dark:bg-[#1a1c28] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>お使いの端末に自動保存中</span>
            </span>
            <span className="text-[11px] text-gray-400">ログイン不要・安心の端末保存</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            推しサポのデータはお使いのスマホやパソコンの中に自動で保存されます。通信が切れてもオフラインでそのまま使えます。
          </p>
          <div className="flex items-center gap-4 pt-1 border-t border-gray-200/60 dark:border-[#262838] text-[11px] text-gray-500 dark:text-gray-400">
            <span>登録推し: <strong className="text-gray-800 dark:text-gray-200">{oshis.length}</strong> 人</span>
            <span>予定: <strong className="text-gray-800 dark:text-gray-200">{events.length}</strong> 件</span>
            <span>グッズ: <strong className="text-gray-800 dark:text-gray-200">{goods.length}</strong> 点</span>
          </div>
        </div>

        {/* Device Direct Sync Card */}
        <div className="p-3.5 rounded-lg border border-gray-200 dark:border-[#262838] bg-white dark:bg-[#191a26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white">
              <RefreshCw className="w-3.5 h-3.5 text-pink-500" />
              <span>端末同士のデータ同期（PC・スマホ）</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              画面に出る6桁の番号で直接同期。端末間でのみ通信するため、データがサーバーに保存・公開されることは一切ありません。
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>6桁の番号で同期する</span>
          </button>
        </div>

        {/* Backup Export / Import Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Backup Export */}
          <div className="p-3.5 rounded-lg border border-gray-200 dark:border-[#262838] bg-white dark:bg-[#191a26] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white">
                <Download className="w-3.5 h-3.5 text-pink-500" />
                <span>バックアップファイルを作る（保存）</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                全データをファイルとして端末にダウンロードします。スマホの機種変更や定期的な保管にご利用ください。
              </p>
            </div>

            <button
              onClick={handleExportBackup}
              disabled={isProcessing}
              className="w-full py-2 px-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>バックアップをダウンロード</span>
            </button>
          </div>

          {/* Backup Import */}
          <div className="p-3.5 rounded-lg border border-gray-200 dark:border-[#262838] bg-white dark:bg-[#191a26] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white">
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>バックアップファイルから復元する</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                過去に保存したバックアップファイル（.json）を選択し、アプリ内にデータを復元します。
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
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>ファイルを選んで復元</span>
              </button>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1.5 font-medium leading-relaxed">
                ※ 端末のダウンロードフォルダ等に保存したバックアップファイル（.json）があれば、ここから選ぶだけでいつでも元通りに復元できます。
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: データ初期化 */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#262838] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>すべてのデータを消去</span>
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              アプリ内に保存されているすべての推し活データを消去します。
            </p>
          </div>

          <button
            onClick={() => setIsClearAllConfirmOpen(true)}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition flex items-center gap-1 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>すべてのデータを消去</span>
          </button>
        </div>
      </div>

      {/* Admin Maintenance Card */}
      <div className="bg-white dark:bg-[#161822] rounded-xl border border-gray-200 dark:border-[#262838] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-white">
            <Wrench className="w-4 h-4 text-amber-500" />
            <span>運営・管理者用（メンテナンス切替）</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
            管理者機能
          </span>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          GitHub Actionsから<strong>「Run workflow」ボタンを1回押すだけ</strong>で、本番サイトをメンテナンス中モードに即座に切り替えられます。
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href="https://github.com/toku0716/oshi_web/actions/workflows/maintenance.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black dark:bg-[#202334] dark:hover:bg-[#282c42] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>GitHubでメンテナンス切替（1クリック実行）</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>

          {onPreviewMaintenance && (
            <button
              type="button"
              onClick={onPreviewMaintenance}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#383d56] hover:bg-gray-50 dark:hover:bg-[#202334] text-gray-700 dark:text-gray-200 font-bold text-xs transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-pink-500" />
              <span>メンテナンス画面をプレビュー</span>
            </button>
          )}
        </div>
      </div>

      {/* App Version & Info */}
      <div className="text-center text-xs text-gray-400 pt-2 space-y-1.5">
        <p className="font-semibold text-gray-500 dark:text-gray-400">推しサポ Web版</p>
        <p className="text-[11px] text-gray-400">
          端末内自動保存 ＆ バックアップファイル対応
        </p>
        {onOpenTermsModal && (
          <div>
            <button
              type="button"
              onClick={onOpenTermsModal}
              className="text-[11px] text-pink-500 hover:text-pink-600 underline font-medium hover:opacity-80 transition inline-block py-1"
            >
              利用規約・機能について
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
        warningNote="※ 端末に現在入っているデータはバックアップの内容に置き換わります。必要に応じて事前に現在のバックアップをダウンロードしてください。"
        confirmLabel="上書きして復元する"
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
