import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todoRepository } from '../repository';
import type { Todo } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatJapaneseDate } from '../utils/helpers';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Trash2,
  Edit,
  Heart,
  Calendar,
} from 'lucide-react';

interface TodoViewProps {
  onOpenTodoModal: (targetTodo?: Todo) => void;
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

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter based on active oshi
  const oshiFiltered = activeOshiId === 'all'
    ? todos
    : todos.filter((t) => t.oshiId === activeOshiId);

  // Filter based on completed status
  const displayedTodos = oshiFiltered.filter((t) => {
    if (filterStatus === 'uncompleted') return !t.completed;
    if (filterStatus === 'completed') return t.completed;
    return true;
  });

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const updated = await todoRepository.toggleComplete(todo.id);
      await refreshAllData();
      if (updated?.completed) {
        showToast('TODOを完了しました！', 'success');
      } else {
        showToast('未完了に戻しました', 'info');
      }
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
    <div className="space-y-4 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Header and Add Button */}
      <div className="bento-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white flex items-center gap-2">
            <span>推し活TODO</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400 num-tabular">
              {uncompletedCount}件未完了
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            ライブ準備、チケット発券、グッズ購入などの推し活やることリスト
          </p>
        </div>

        <button
          onClick={() => onOpenTodoModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs shadow-xs active:scale-95 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>TODOを追加</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus('uncompleted')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            filterStatus === 'uncompleted'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
              : 'bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--border-subtle)] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>未完了</span>
          <span className="text-[10px] opacity-80 num-tabular">
            {uncompletedCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            filterStatus === 'completed'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
              : 'bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--border-subtle)] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>完了済み</span>
          <span className="text-[10px] opacity-80 num-tabular">
            {completedCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterStatus === 'all'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
              : 'bg-black/[0.03] dark:bg-white/[0.05] border border-[var(--border-subtle)] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          すべて ({oshiFiltered.length})
        </button>
      </div>

      {/* Todos List */}
      <div className="bento-card rounded-xl p-4 sm:p-5">
        {displayedTodos.length === 0 ? (
          <div className="text-center py-10 bg-black/[0.01] dark:bg-white/[0.01] rounded-lg border border-dashed border-[var(--border-subtle)]">
            <CheckCircle2 className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              {filterStatus === 'uncompleted'
                ? '未完了のTODOはありません'
                : filterStatus === 'completed'
                ? '完了したTODOはまだありません'
                : '登録されているTODOはありません'}
            </p>
            <p className="text-[11px] text-neutral-400 mb-3">
              ライブの持ち物チェックやチケット申し込み等のTODOを登録しましょう！
            </p>
            <button
              onClick={() => onOpenTodoModal()}
              className="px-3 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TODOを登録</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedTodos.map((todo) => {
              const isDueToday = todo.dueDate === todayStr;
              const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < todayStr;
              const oshi = oshis.find((o) => o.id === todo.oshiId);
              const event = events.find((e) => e.id === todo.eventId);

              return (
                <div
                  key={todo.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 group ${
                    todo.completed
                      ? 'bg-black/[0.02] dark:bg-white/[0.02] border-[var(--border-subtle)] opacity-55'
                      : isOverdue
                      ? 'bg-rose-500/10 border-rose-500/25'
                      : isDueToday
                      ? 'bg-amber-500/10 border-amber-500/25'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-muted)] bg-[var(--bg-surface)]'
                  }`}
                >
                  {/* Left: Complete Toggle & Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggleTodo(todo)}
                      className="p-1 text-neutral-400 hover:text-emerald-500 transition shrink-0 mt-0.5 sm:mt-0"
                      title={todo.completed ? '未完了に戻す' : '完了にする'}
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5 stroke-[1.8]" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span
                          className={`text-xs font-semibold ${
                            todo.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
                          }`}
                        >
                          {todo.title}
                        </span>

                        {todo.priority === 'high' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            優先度: 高
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                        {todo.dueDate && (
                          <span
                            className={`flex items-center gap-1 font-medium num-tabular ${
                              todo.completed
                                ? 'text-neutral-400'
                                : isOverdue
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : isDueToday
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-neutral-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isDueToday
                              ? '今日が期限！'
                              : isOverdue
                              ? `期限切れ (${formatJapaneseDate(todo.dueDate)})`
                              : `期限: ${formatJapaneseDate(todo.dueDate)}`}
                          </span>
                        )}

                        {oshi && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold"
                            style={{ color: oshi.color }}
                          >
                            <Heart className="w-3 h-3 fill-current" />
                            <span>{oshi.name}</span>
                          </span>
                        )}

                        {event && (
                          <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                            <Calendar className="w-3 h-3 text-neutral-400" />
                            <span>{event.title}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenTodoModal(todo)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                      title="編集"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTodoToDelete(todo)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 transition"
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!todoToDelete}
        onClose={() => setTodoToDelete(null)}
        onConfirm={handleDelete}
        title="TODOの削除"
        message={`「${todoToDelete?.title}」を削除してもよろしいですか？`}
        confirmLabel="削除する"
        variant="danger"
      />
    </div>
  );
};
