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
      showToast(targetTodo ? 'TODOを更新しました' : '新しいTODOを追加しました', 'success');
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
      title={targetTodo ? 'TODOの編集' : '新しいTODOを追加'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            やるべきこと (TODO) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="例: チケット発券 / 会場アクセス確認 / うちわ作り"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
          />
        </div>

        {/* Due Date & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              期日
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              優先度
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl border border-[var(--border-subtle)]">
              {(['low', 'medium', 'high'] as TodoPriority[]).map((p) => {
                const isSelected = priority === p;
                const label = p === 'high' ? '高' : p === 'medium' ? '中' : '低';
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      isSelected
                        ? p === 'high'
                          ? 'bg-rose-500 text-white shadow-2xs'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-emerald-500 text-white shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Oshi & Event */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              推しの紐付け
            </label>
            <select
              value={oshiId}
              onChange={(e) => setOshiId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
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
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              関連イベント
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
            >
              <option value="">指定なし</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.date})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Memo */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            備考 / メモ
          </label>
          <textarea
            rows={2}
            placeholder="詳細や補足情報など"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.03] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-lg transition"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 rounded-lg transition shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : targetTodo ? '更新する' : '登録する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
