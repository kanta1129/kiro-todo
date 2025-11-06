import { useCallback } from 'react';
import { useTaskStore } from '../stores';
import type { CreateTaskInput, UpdateTaskInput, UseTasksReturn } from '../types';

/**
 * Custom hook for task management operations
 * Provides a convenient interface to the task store
 * Requirements: 1.1, 1.2, 4.1, 4.4, 5.1, 5.2
 */
export function useTasks(): UseTasksReturn {
  const {
    tasks,
    isLoading,
    error,
    addTask: storeAddTask,
    updateTask: storeUpdateTask,
    deleteTask: storeDeleteTask,
    completeTask: storeCompleteTask,
    clearError,
  } = useTaskStore();

  // Wrap store actions with async interface for consistency
  const addTask = useCallback(async (task: CreateTaskInput) => {
    try {
      clearError();
      storeAddTask(task);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add task');
    }
  }, [storeAddTask, clearError]);

  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput) => {
    try {
      clearError();
      storeUpdateTask(id, updates);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [storeUpdateTask, clearError]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      clearError();
      storeDeleteTask(id);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }, [storeDeleteTask, clearError]);

  const completeTask = useCallback(async (id: string) => {
    try {
      clearError();
      storeCompleteTask(id);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to complete task');
    }
  }, [storeCompleteTask, clearError]);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    isLoading,
    error,
  };
}