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

const EVENT_PRESET_CHIPS: { label: string; category: EventCategory; ticketStatus: TicketStatus }[] = [
  { label: 'ライブ・ツアー公演', category: 'live', ticketStatus: 'applied' },
  { label: 'ファンミーティング', category: 'event', ticketStatus: 'applied' },
  { label: '誕生日・記念日', category: 'release', ticketStatus: 'none' },
  { label: '配信・番組出演', category: 'broadcast', ticketStatus: 'none' },
  { label: 'チケット当落発表日', category: 'ticket', ticketStatus: 'applied' },
  { label: 'チケット入金・発券期限', category: 'ticket', ticketStatus: 'won' },
];

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
      setOshiId(activeOshiId !== 'all' ? activeOshiId : oshis[0]?.id || '');
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
      showToast(
        targetEvent ? '予定を更新しました' : '新しい予定を登録しました',
        'success'
      );
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
      title={targetEvent ? '予定の編集' : '予定を登録'}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        {!targetEvent && (
          <div className="form-group">
            <label>テンプレートから入力</label>
            <div className="chip-group">
              {EVENT_PRESET_CHIPS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="chip"
                  onClick={() => {
                    if (!title) setTitle(preset.label);
                    setCategory(preset.category);
                    setTicketStatus(preset.ticketStatus);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>予定名・公演名 (必須)</label>
          <input
            type="text"
            required
            placeholder="例: 全国ツアー 東京公演"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>日付 (必須)</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>時間</label>
            <input
              type="text"
              placeholder="例: 開演 18:00 (開場 16:30)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>カテゴリー</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
            >
              {(Object.keys(EVENT_CATEGORY_CONFIG) as EventCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {EVENT_CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>チケット状況</label>
            <select
              value={ticketStatus}
              onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
            >
              {(Object.keys(TICKET_STATUS_CONFIG) as TicketStatus[]).map((st) => (
                <option key={st} value={st}>
                  {TICKET_STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>対象の推し</label>
            <select value={oshiId} onChange={(e) => setOshiId(e.target.value)}>
              <option value="">指定なし</option>
              {oshis.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>会場 / 場所</label>
            <input
              type="text"
              placeholder="例: 東京ドーム / YouTube"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>メモ・座席番号</label>
          <textarea
            rows={2}
            placeholder="座席番号、整理番号、同行者、メモなど"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : targetEvent ? '更新する' : '登録する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
