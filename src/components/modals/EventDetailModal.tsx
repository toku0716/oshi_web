import React, { useState } from 'react';
import type { OshiEvent } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EventCategoryBadge, TicketStatusBadge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { eventRepository } from '../../repository';
import { formatJapaneseDate, getDaysDiff } from '../../utils/helpers';
import { Clock, MapPin, Heart, Edit, Trash2, CheckSquare, Calendar } from 'lucide-react';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: OshiEvent | null;
  onEdit: (event: OshiEvent) => void;
  onAddTodoForEvent?: (event: OshiEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onAddTodoForEvent,
}) => {
  const { oshis, refreshAllData, showToast } = useApp();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!event) return null;

  const oshi = oshis.find((o) => o.id === event.oshiId);
  const daysDiff = getDaysDiff(event.date);

  const handleDelete = async () => {
    try {
      await eventRepository.delete(event.id);
      await refreshAllData();
      showToast('イベントを削除しました', 'info');
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch {
      showToast('削除処理に失敗しました', 'error');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="イベント詳細" maxWidth="md">
        <div className="space-y-4">
          {/* Header & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <EventCategoryBadge category={event.category} />
              <TicketStatusBadge status={event.ticketStatus} />
              {oshi && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${oshi.color}15`,
                    color: oshi.color,
                  }}
                >
                  <Heart className="w-3 h-3 fill-current" />
                  <span>{oshi.name}</span>
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-neutral-900 dark:text-white leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Countdown Highlight */}
          <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--border-subtle)] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 flex items-center justify-center font-bold text-sm">
                <Calendar className="w-4 h-4 text-neutral-500" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">開催日</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white num-tabular">{formatJapaneseDate(event.date)}</p>
              </div>
            </div>
            <div className="text-right">
              {daysDiff > 0 ? (
                <div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">開催まであと</span>
                  <p className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight num-tabular">
                    {daysDiff} <span className="text-xs font-normal text-neutral-400">日</span>
                  </p>
                </div>
              ) : daysDiff === 0 ? (
                <span className="inline-block px-2.5 py-1 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold shadow-xs">
                  本日開催
                </span>
              ) : (
                <span className="text-xs text-neutral-400 font-medium">開催終了</span>
              )}
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 bg-black/[0.01] dark:bg-white/[0.02] rounded-xl p-3.5 border border-[var(--border-subtle)] text-xs">
            {event.time && (
              <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300">
                <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="font-medium num-tabular">{event.time}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="font-medium">{event.location}</span>
              </div>
            )}
            {event.memo && (
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <p className="text-xs font-semibold text-neutral-400 mb-1">備考 / メモ</p>
                <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {event.memo}
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="text-xs text-rose-500 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-500/10 flex items-center gap-1.5 font-medium transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>削除</span>
            </button>

            <div className="flex items-center gap-2">
              {onAddTodoForEvent && (
                <button
                  onClick={() => {
                    onClose();
                    onAddTodoForEvent(event);
                  }}
                  className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition"
                >
                  <CheckSquare className="w-4 h-4 text-neutral-500" />
                  <span>準備TODOを追加</span>
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-xs font-semibold text-white dark:text-neutral-900 flex items-center gap-1.5 transition shadow-xs"
              >
                <Edit className="w-4 h-4" />
                <span>編集</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="イベントの削除"
        message={`「${event.title}」を削除してもよろしいですか？`}
        confirmLabel="削除する"
        variant="danger"
      />
    </>
  );
};
