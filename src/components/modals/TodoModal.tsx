import React, { useState, useEffect } from 'react';
import type { Todo, TodoPriority } from '../../types';
import { Modal } from '../common/Modal';
import { todoRepository } from '../../repository';
import { useApp } from '../../context/AppContext';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTodo?: Todo | null;
  defaultEventId?: string;
}

const TODO_PRESETS = [
  'ペンライト電池交換・点灯確認',
  'チケット発券・分配確認',
  '本人確認書類・会員証の準備',
  '双眼鏡の準備',
  'うちわ・ボード作成',
  '交通機関・宿泊の手配',
];

export const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  targetTodo,
  defaultEventId,
}) => {
  const { oshis, events, activeOshiId, refreshAllData, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [oshiId, setOshiId] = useState('');
  const [eventId, setEventId] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetTodo) {
      setTitle(targetTodo.title);
      setDueDate(targetTodo.dueDate || '');
      setPriority(targetTodo.priority || 'medium');
      setOshiId(targetTodo.oshiId || '');
      setEventId(targetTodo.eventId || '');
      setMemo(targetTodo.memo || '');
    } else {
      setTitle('');
      setDueDate('');
      setPriority('medium');
      setOshiId(activeOshiId !== 'all' ? activeOshiId : (oshis[0]?.id || ''));
      setEventId(defaultEventId || '');
      setMemo('');
    }
  }, [targetTodo, defaultEventId, activeOshiId, oshis, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('TODOを入力してください', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const todoData: Todo = {
        id: targetTodo?.id || `todo-${Date.now()}`,
        title: title.trim(),
        dueDate: dueDate || undefined,
        completed: targetTodo?.completed || false,
        completedAt: targetTodo?.completedAt,
        priority,
        oshiId: oshiId || undefined,
        eventId: eventId || undefined,
        memo: memo.trim() || undefined,
        createdAt: targetTodo?.createdAt || now,
        updatedAt: now,
      };

      await todoRepository.save(todoData);
      await refreshAllData();
      showToast(targetTodo ? 'TODOを更新しました' : 'TODOを追加しました', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('TODOの保存に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetTodo ? 'TODOの編集' : 'TODOを追加'}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        {!targetTodo && (
          <div className="form-group">
            <label>よく使う項目から入力</label>
            <div className="chip-group">
              {TODO_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="chip"
                  onClick={() => setTitle(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>内容 (必須)</label>
          <input
            type="text"
            required
            placeholder="例: チケット発券 / ペンライト電池交換"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>期限日</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>優先度</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TodoPriority)}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
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
            <label>関連する予定</label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">指定なし</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.date})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>メモ</label>
          <textarea
            rows={2}
            placeholder="発券番号、補足メモなど"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : targetTodo ? '更新する' : '追加する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
