import React, { useState } from 'react';
import type { OshiEvent, Todo } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { EventCategoryBadge, TicketStatusBadge, CountdownBadge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { eventRepository, todoRepository } from '../../repository';
import { formatJapaneseDate } from '../../utils/helpers';

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
  const { oshis, todos, refreshAllData, showToast } = useApp();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!event) return null;

  const oshi = oshis.find((o) => o.id === event.oshiId);
  const linkedTodos = todos.filter((t) => t.eventId === event.id);

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const updated: Todo = {
        ...todo,
        completed: !todo.completed,
        completedAt: !todo.completed ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
      await todoRepository.save(updated);
      await refreshAllData();
      showToast(updated.completed ? '完了しました' : '未完了に戻しました', 'info');
    } catch {
      showToast('更新に失敗しました', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await eventRepository.delete(event.id);
      await refreshAllData();
      showToast('予定を削除しました', 'info');
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch {
      showToast('削除処理に失敗しました', 'error');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="予定詳細">
        <div className="form-stack">
          <div>
            <div className="flex-row" style={{ marginBottom: '6px' }}>
              <EventCategoryBadge category={event.category} />
              <TicketStatusBadge status={event.ticketStatus} />
              <CountdownBadge date={event.date} />
              {oshi && <span className="badge">推し: {oshi.name}</span>}
            </div>
            <h3 style={{ margin: '0 0 8px' }}>{event.title}</h3>
            <p>
              <strong>開催日:</strong> {formatJapaneseDate(event.date)}
            </p>
            {event.time && (
              <p>
                <strong>時間:</strong> {event.time}
              </p>
            )}
            {event.location && (
              <p>
                <strong>会場・場所:</strong> {event.location}
              </p>
            )}
            {event.memo && (
              <p>
                <strong>メモ:</strong> {event.memo}
              </p>
            )}
          </div>

          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <strong>
                関連TODO ({linkedTodos.filter((t) => t.completed).length}/{linkedTodos.length})
              </strong>
              {onAddTodoForEvent && (
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => {
                    onClose();
                    onAddTodoForEvent(event);
                  }}
                >
                  ＋ 準備TODOを追加
                </button>
              )}
            </div>
            {linkedTodos.length > 0 ? (
              <ul className="item-list">
                {linkedTodos.map((todo) => (
                  <li key={todo.id} className="item-row">
                    <label className="flex-row" style={{ cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo)}
                      />
                      <span>{todo.completed ? <s>{todo.title}</s> : todo.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted" style={{ marginBottom: 0 }}>
                関連するTODOはありません。
              </p>
            )}
          </div>

          <div className="flex-between">
            <button
              type="button"
              className="btn-danger"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              削除
            </button>
            <div className="flex-row">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
              >
                予定を編集する
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="予定の削除"
        message={`「${event.title}」を削除してもよろしいですか？`}
        confirmLabel="削除する"
      />
    </>
  );
};
