import React, { useState, useEffect } from 'react';
import type { OshiEvent, EventCategory, TicketStatus } from '../../types';
import { Modal } from '../common/Modal';
import { eventRepository } from '../../repository';
import { useApp } from '../../context/AppContext';
import { EVENT_CATEGORY_CONFIG, TICKET_STATUS_CONFIG } from '../common/Badge';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEvent?: OshiEvent | null;
  defaultDate?: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  targetEvent,
  defaultDate,
}) => {
  const { oshis, activeOshiId, refreshAllData, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [oshiId, setOshiId] = useState('');
  const [category, setCategory] = useState<EventCategory>('live');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('none');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetEvent) {
      setTitle(targetEvent.title);
      setDate(targetEvent.date);
      setTime(targetEvent.time || '');
      setLocation(targetEvent.location || '');
      setOshiId(targetEvent.oshiId || '');
      setCategory(targetEvent.category || 'live');
      setTicketStatus(targetEvent.ticketStatus || 'none');
      setMemo(targetEvent.memo || '');
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      setTitle('');
      setDate(defaultDate || todayStr);
      setTime('');
      setLocation('');
      setOshiId(activeOshiId !== 'all' ? activeOshiId : (oshis[0]?.id || ''));
      setCategory('live');
      setTicketStatus('none');
      setMemo('');
    }
  }, [targetEvent, defaultDate, activeOshiId, oshis, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      showToast('イベント名と日付は必須です', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const eventData: OshiEvent = {
        id: targetEvent?.id || `event-${Date.now()}`,
        title: title.trim(),
        date,
        time: time.trim() || undefined,
        location: location.trim() || undefined,
        oshiId: oshiId || undefined,
        category,
        ticketStatus,
        memo: memo.trim() || undefined,
        createdAt: targetEvent?.createdAt || now,
        updatedAt: now,
      };

      await eventRepository.save(eventData);
      await refreshAllData();
      showToast(targetEvent ? '予定を更新しました' : '予定を追加しました！📅', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('予定の保存に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetEvent ? 'イベント予定の編集' : 'イベント予定の追加'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            イベント・予定名 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="例: 全国ツアー2026 東京ドーム公演"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              日付 <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              時間
            </label>
            <input
              type="text"
              placeholder="例: 18:00〜 / 17:30開場"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            場所 / 会場 / 配信先
          </label>
          <input
            type="text"
            placeholder="例: 日本武道館 / YouTube公式"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />
        </div>

        {/* Oshi & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              関連する推し
            </label>
            <select
              value={oshiId}
              onChange={(e) => setOshiId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
            >
              <option value="">指定なし</option>
              {oshis.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
            >
              {(Object.keys(EVENT_CATEGORY_CONFIG) as EventCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {EVENT_CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ticket Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            チケット状況
          </label>
          <select
            value={ticketStatus}
            onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
          >
            {(Object.keys(TICKET_STATUS_CONFIG) as TicketStatus[]).map((st) => (
              <option key={st} value={st}>
                {TICKET_STATUS_CONFIG[st].label}
              </option>
            ))}
          </select>
        </div>

        {/* Memo */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            メモ・準備事項
          </label>
          <textarea
            rows={3}
            placeholder="持ち物、座席番号、注意事項など"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : targetEvent ? '更新する' : '追加する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
