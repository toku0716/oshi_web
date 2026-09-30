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
  Filter,
  CheckSquare,
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
        showToast('TODOを完了しました', 'success');
      } else {
        showToast('未完了に戻しました', 'info');
      }
    } catch {
      showToast('更新に失敗しました', 'error');
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
      showToast('削除に失敗しました', 'error');
    }
  };

  const uncompletedCount = oshiFiltered.filter((t) => !t.completed).length;
  const completedCount = oshiFiltered.filter((t) => t.completed).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header and Add Button */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-pink-500" />
            <span>推し活TODO</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            ライブ準備、チケット発券、ファンレター、グッズ購入などのタスクを整理
          </p>
        </div>

        <button
          onClick={() => onOpenTodoModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs transition transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>TODOを追加</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('uncompleted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterStatus === 'uncompleted'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white border border-gray-200/80 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>未完了</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterStatus === 'uncompleted' ? 'bg-white/20' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {uncompletedCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterStatus === 'completed'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white border border-gray-200/80 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>完了済み</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterStatus === 'completed' ? 'bg-white/20' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {completedCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white border border-gray-200/80 text-gray-600 hover:bg-gray-50'
            }`}
          >
            すべて ({oshiFiltered.length})
          </button>
        </div>
      </div>

      {/* Todos List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-4 sm:p-6">
        {displayedTodos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600 mb-1">
              {filterStatus === 'uncompleted'
                ? '未完了のTODOはありません'
                : filterStatus === 'completed'
                ? '完了したTODOはまだありません'
                : 'TODOが登録されていません'}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              ライブの持ち物チェックや予約タスクを登録しましょう！
            </p>
            <button
              onClick={() => onOpenTodoModal()}
              className="px-4 py-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 font-bold text-xs transition inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TODOを登録する</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedTodos.map((todo) => {
              const isDueToday = todo.dueDate === todayStr;
              const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < todayStr;
              const oshi = oshis.find((o) => o.id === todo.oshiId);
              const event = events.find((e) => e.id === todo.eventId);

              return (
                <div
                  key={todo.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 group ${
                    todo.completed
                      ? 'bg-gray-50/60 border-gray-100 opacity-60'
                      : isOverdue
                      ? 'bg-rose-50/30 border-rose-200/80 shadow-2xs'
                      : isDueToday
                      ? 'bg-amber-50/30 border-amber-200/80 shadow-2xs'
                      : 'bg-white border-gray-100 hover:border-pink-200 hover:bg-pink-50/20 shadow-2xs'
                  }`}
                >
                  {/* Left: Complete Toggle & Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggleTodo(todo)}
                      className="p-1 text-gray-300 hover:text-emerald-500 transition shrink-0 mt-0.5 sm:mt-0"
                      title={todo.completed ? '未完了に戻す' : '完了にする'}
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Circle className="w-5 h-5 stroke-[2]" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span
                          className={`text-sm font-bold ${
                            todo.completed ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {todo.title}
                        </span>

                        {todo.priority === 'high' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            優先度: 高
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {todo.dueDate && (
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              todo.completed
                                ? 'text-gray-400'
                                : isOverdue
                                ? 'text-rose-600 font-bold'
                                : isDueToday
                                ? 'text-amber-600 font-bold'
                                : 'text-gray-500'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {isDueToday
                              ? '今日が期限！'
                              : isOverdue
                              ? `期限切れ (${formatJapaneseDate(todo.dueDate)})`
                              : `期限: ${formatJapaneseDate(todo.dueDate)}`}
                          </span>
                        )}

                        {oshi && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold"
                            style={{ color: oshi.color }}
                          >
                            <Heart className="w-3 h-3 fill-current" />
                            {oshi.name}
                          </span>
                        )}

                        {event && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 truncate max-w-[200px]">
                            <Calendar className="w-3 h-3" />
                            {event.title}
                          </span>
                        )}
                      </div>

                      {todo.memo && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {todo.memo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenTodoModal(todo)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                      title="編集"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTodoToDelete(todo)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
