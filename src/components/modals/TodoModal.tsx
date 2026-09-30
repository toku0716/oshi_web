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
      showToast('TODOのタイトルを入力してください', 'error');
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
      showToast(targetTodo ? 'TODOを更新しました' : 'TODOを追加しました！', 'success');
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
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            やるべきこと（タスク名） <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="例: チケットの発券 / ペンライトの電池交換"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />
        </div>

        {/* Due Date & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              期限日
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              優先度
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
              {(['low', 'medium', 'high'] as TodoPriority[]).map((p) => {
                const isSelected = priority === p;
                const label = p === 'high' ? '高' : p === 'medium' ? '中' : '低';
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition ${
                      isSelected
                        ? p === 'high'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-emerald-500 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              推しの紐付け
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
              関連イベント
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white"
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
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            メモ
          </label>
          <textarea
            rows={2}
            placeholder="詳細や注意点など"
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
            {isSubmitting ? '保存中...' : targetTodo ? '更新する' : '追加する'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
