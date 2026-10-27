import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todoRepository } from '../repository';
import type { Todo, TodoPriority } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatJapaneseDate } from '../utils/helpers';

interface TodoViewProps {
  onOpenTodoModal: (targetTodo?: Todo, eventId?: string) => void;
}

export const TodoView: React.FC<TodoViewProps> = ({ onOpenTodoModal }) => {
  const {
    oshis,
    events,
    todos,
    activeOshiId,
    refreshAllData,
    showToast,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'uncompleted' | 'completed' | 'all'>('uncompleted');
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);

  // クイック追加フォーム用
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickPriority, setQuickPriority] = useState<TodoPriority>('medium');

  const oshiFiltered =
    activeOshiId === 'all'
      ? todos
      : todos.filter((t) => t.oshiId === activeOshiId);

  const displayedTodos = oshiFiltered
    .filter((t) => {
      if (filterStatus === 'uncompleted') return !t.completed;
      if (filterStatus === 'completed') return t.completed;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
    });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    try {
      const now = new Date().toISOString();
      await todoRepository.save({
        id: `todo-${Date.now()}`,
        title: quickTitle.trim(),
        dueDate: quickDueDate || undefined,
        priority: quickPriority,
        completed: false,
        oshiId: activeOshiId !== 'all' ? activeOshiId : oshis[0]?.id,
        createdAt: now,
        updatedAt: now,
      });
      setQuickTitle('');
      setQuickDueDate('');
      await refreshAllData();
      showToast('TODOを追加しました', 'success');
    } catch {
      showToast('TODOの追加に失敗しました', 'error');
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      await todoRepository.toggleComplete(todo.id);
      await refreshAllData();
    } catch {
      showToast('TODOの更新に失敗しました', 'error');
    }
  };

  const handleDelete = async () => {
    if (!todoToDelete) return;
    try {
      await todoRepository.delete(todoToDelete.id);
      await refreshAllData();
      showToast('TODOを削除しました', 'info');
      setTodoToDelete(null);
    } catch {
      showToast('TODOの削除に失敗しました', 'error');
    }
  };

  const uncompletedCount = oshiFiltered.filter((t) => !t.completed).length;
  const completedCount = oshiFiltered.filter((t) => t.completed).length;

  return (
    <div>
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">TODO管理（未完了 {uncompletedCount}件）</h2>
          <button
            type="button"
            onClick={() => onOpenTodoModal()}
          >
            詳細を指定して追加
          </button>
        </div>

        <form onSubmit={handleQuickAdd} className="flex-row" style={{ marginBottom: '12px' }}>
          <input
            type="text"
            required
            placeholder="新しいTODOを入力（例: チケット発券、ペンライト電池確認）"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <input
            type="date"
            value={quickDueDate}
            onChange={(e) => setQuickDueDate(e.target.value)}
            title="期限日（任意）"
          />
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as TodoPriority)}
          >
            <option value="high">優先度: 高</option>
            <option value="medium">優先度: 中</option>
            <option value="low">優先度: 低</option>
          </select>
          <button type="submit" className="btn-primary">
            ＋ 追加
          </button>
        </form>

        <div className="flex-row">
          <button
            type="button"
            className={filterStatus === 'uncompleted' ? 'btn-primary' : ''}
            onClick={() => setFilterStatus('uncompleted')}
          >
            未完了 ({uncompletedCount})
          </button>
          <button
            type="button"
            className={filterStatus === 'completed' ? 'btn-primary' : ''}
            onClick={() => setFilterStatus('completed')}
          >
            完了済み ({completedCount})
          </button>
          <button
            type="button"
            className={filterStatus === 'all' ? 'btn-primary' : ''}
            onClick={() => setFilterStatus('all')}
          >
            すべて ({oshiFiltered.length})
          </button>
        </div>
      </section>

      <section className="card">
        {displayedTodos.length === 0 ? (
          <p className="text-muted">該当するTODOはありません。</p>
        ) : (
          <ul className="item-list">
            {displayedTodos.map((todo) => {
              const oshi = oshis.find((o) => o.id === todo.oshiId);
              const event = events.find((e) => e.id === todo.eventId);
              const priorityLabel =
                todo.priority === 'high'
                  ? '高'
                  : todo.priority === 'medium'
                  ? '中'
                  : '低';
              return (
                <li key={todo.id} className="item-row">
                  <label className="flex-row" style={{ flex: 1, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo)}
                    />
                    <div className="item-main">
                      <div className="item-title">
                        {todo.completed ? <s>{todo.title}</s> : todo.title}{' '}
                        <span className="badge">優先度:{priorityLabel}</span>
                      </div>
                      <div className="item-meta">
                        {todo.dueDate && (
                          <span>期限: {formatJapaneseDate(todo.dueDate)}</span>
                        )}
                        {oshi && <span>推し: {oshi.name}</span>}
                        {event && <span>関連予定: {event.title}</span>}
                      </div>
                    </div>
                  </label>
                  <div className="flex-row">
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => onOpenTodoModal(todo)}
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      onClick={() => setTodoToDelete(todo)}
                    >
                      削除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmModal
        isOpen={!!todoToDelete}
        onClose={() => setTodoToDelete(null)}
        onConfirm={handleDelete}
        title="TODOの削除"
        message={`「${todoToDelete?.title}」を削除してもよろしいですか？`}
        confirmLabel="削除する"
      />
    </div>
  );
};
