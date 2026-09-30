import React, { useState } from 'react';
import type { OshiEvent } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EventCategoryBadge, TicketStatusBadge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { eventRepository } from '../../repository';
import { formatJapaneseDate, getDaysDiff } from '../../utils/helpers';
import { Clock, MapPin, Heart, Edit, Trash2, CheckSquare } from 'lucide-react';

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
      showToast('削除に失敗しました', 'error');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="イベント詳細" maxWidth="md">
        <div className="space-y-5">
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

            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Countdown Highlight */}
          <div className="bg-pink-50/80 dark:bg-[#2a1c28] border border-pink-200/80 dark:border-pink-900/50 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                📅
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-300 font-medium">開催日</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatJapaneseDate(event.date)}</p>
              </div>
            </div>
            <div className="text-right">
              {daysDiff > 0 ? (
                <div>
                  <span className="text-xs text-pink-600 dark:text-pink-400 font-semibold">本番まであと</span>
                  <p className="text-2xl font-black text-pink-600 dark:text-pink-400 tracking-tight">
                    {daysDiff} <span className="text-xs font-normal">日</span>
                  </p>
                </div>
              ) : daysDiff === 0 ? (
                <span className="inline-block px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs">
                  本日開催
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-400 font-medium">終了したイベント</span>
              )}
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3 bg-gray-50/80 dark:bg-[#1f2234] rounded-xl p-3.5 border border-gray-200/80 dark:border-[#353950] text-sm">
            {event.time && (
              <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-200">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-medium">{event.time}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-200">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-medium">{event.location}</span>
              </div>
            )}
            {event.memo && (
              <div className="pt-2 border-t border-gray-200/60 dark:border-[#353950]">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">メモ</p>
                <p className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {event.memo}
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2b2f45]">
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="text-xs text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 flex items-center gap-1.5 font-medium transition"
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
                  className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition"
                >
                  <CheckSquare className="w-4 h-4 text-pink-500" />
                  <span>準備TODOを追加</span>
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-xs"
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
        title="イベント予定の削除"
        message={`「${event.title}」を削除してもよろしいですか？`}
        confirmLabel="削除する"
        variant="danger"
      />
    </>
  );
};
