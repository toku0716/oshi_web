import { getDB } from '../db/database';
import type { Todo } from '../types';

export const todoRepository = {
  async getAll(): Promise<Todo[]> {
    const db = await getDB();
    const list = await db.getAll('todos');
    return list.sort((a, b) => {
      // Uncompleted first
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Due date asc (empty due dates last)
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  },

  async getPending(limit = 10): Promise<Todo[]> {
    const db = await getDB();
    const all = await db.getAll('todos');
    return all
      .filter((t) => !t.completed)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.createdAt.localeCompare(b.createdAt);
      })
      .slice(0, limit);
  },

  async toggleComplete(id: string): Promise<Todo | undefined> {
    const db = await getDB();
    const item = await db.get('todos', id);
    if (!item) return undefined;
    const now = new Date().toISOString();
    const updated: Todo = {
      ...item,
      completed: !item.completed,
      completedAt: !item.completed ? now : undefined,
      updatedAt: now,
    };
    await db.put('todos', updated);
    return updated;
  },

  async save(todo: Todo): Promise<void> {
    const db = await getDB();
    const now = new Date().toISOString();
    const existing = await db.get('todos', todo.id);
    const itemToSave: Todo = {
      ...todo,
      createdAt: existing?.createdAt || todo.createdAt || now,
      updatedAt: now,
    };
    await db.put('todos', itemToSave);
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('todos', id);
  },
};
