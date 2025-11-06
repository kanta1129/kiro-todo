'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect, memo } from 'react';
import type { TaskListProps, Task, FreshnessState, SortDirection } from '../../types';
import { TaskItem } from '../TaskItem/TaskItem';
import { useAnimations } from '../../hooks/useAnimations';

/**
 * TaskList component with sections and sorting
 * Requirements: 3.5, 4.3, 2.4
 * Optimized with React.memo for performance
 */
const TaskList = memo(function TaskList({
  tasks,
  onTaskEdit,
  onTaskComplete,
  onTaskDelete,
  showCompleted = false,
  sortBy = 'dueDate',
  filterBy,
  className = '',
}: TaskListProps) {
  const [revealedTombstones, setRevealedTombstones] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for animation targets
  const taskListRef = useRef<HTMLDivElement>(null);
  const sortButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Animation hooks
  const {
    showError,
    showSuccess,
    enhanceButton,
    removeButtonEnhancement,
  } = useAnimations();

  // Enhance sort buttons with interactive feedback
  useEffect(() => {
    const buttons = Object.values(sortButtonRefs.current);
    buttons.forEach(button => {
      if (button) {
        enhanceButton(button);
      }
    });

    return () => {
      buttons.forEach(button => {
        if (button) {
          removeButtonEnhancement(button);
        }
      });
    };
  }, [enhanceButton, removeButtonEnhancement]);

  // Handle tombstone reveal
  const handleReveal = useCallback((taskId: string) => {
    setRevealedTombstones(prev => prev.includes(taskId) ? prev : [...prev, taskId]);
    showSuccess('期限切れタスクを表示しました');
  }, [showSuccess]);

  // Memoized sort orders for performance
  const freshnessOrder = useMemo(() => ({
    '新規': 0,
    '期限接近': 1,
    '期限間近': 2,
    '期限切れ': 3,
  }), []);

  const priorityOrder = useMemo(() => ({
    high: 0,
    medium: 1,
    low: 2
  }), []);

  // Sort tasks based on current sort configuration
  const sortTasks = useCallback((tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      let comparison = 0;

      switch (currentSortBy) {
        case 'dueDate':
          comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
        case 'freshness':
          comparison = freshnessOrder[a.freshnessState] - freshnessOrder[b.freshnessState];
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [currentSortBy, sortDirection, freshnessOrder, priorityOrder]);

  // Filter tasks based on filter configuration
  const filterTasks = useCallback((tasksToFilter: Task[]) => {
    if (!filterBy) return tasksToFilter;

    return tasksToFilter.filter(task => {
      // Filter by priority
      if (filterBy.priority && filterBy.priority.length > 0) {
        if (!filterBy.priority.includes(task.priority)) {
          return false;
        }
      }

      // Filter by freshness state
      if (filterBy.freshnessState && filterBy.freshnessState.length > 0) {
        if (!filterBy.freshnessState.includes(task.freshnessState)) {
          return false;
        }
      }

      return true;
    });
  }, [filterBy]);

  // Separate and process tasks
  const { activeTasks, tombstoneTasks, completedTasks } = useMemo(() => {
    const filteredTasks = filterTasks(tasks);

    // Separate tasks by completion status
    const completed = showCompleted ? filteredTasks.filter(task => task.completed) : [];
    const incomplete = filteredTasks.filter(task => !task.completed);

    // Separate incomplete tasks by freshness state
    const active = incomplete.filter(task => task.freshnessState !== '期限切れ');
    const tombstone = incomplete.filter(task => task.freshnessState === '期限切れ');

    return {
      activeTasks: sortTasks(active),
      tombstoneTasks: sortTasks(tombstone),
      completedTasks: sortTasks(completed),
    };
  }, [tasks, filterTasks, sortTasks, showCompleted]);

  // Enhanced task handlers with error handling
  const handleTaskEdit = useCallback(async (taskId: string, updates: any) => {
    try {
      setError(null);
      await onTaskEdit?.(taskId, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'タスクの編集に失敗しました';
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [onTaskEdit, showError]);

  const handleTaskComplete = useCallback(async (taskId: string) => {
    try {
      setError(null);
      await onTaskComplete?.(taskId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'タスクの完了に失敗しました';
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [onTaskComplete, showError]);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      setError(null);
      await onTaskDelete?.(taskId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'タスクの削除に失敗しました';
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [onTaskDelete, showError]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    if (newSortBy === currentSortBy) {
      // Toggle direction if same sort field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Change sort field and reset to ascending
      setCurrentSortBy(newSortBy);
      setSortDirection('asc');
    }
  }, [currentSortBy]);

  // Get sort button class
  const getSortButtonClass = useCallback((sortField: typeof sortBy) => {
    const isActive = currentSortBy === sortField;
    return `px-3 py-1 text-xs rounded transition-colors ${
      isActive 
        ? 'bg-blue-500 text-white' 
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;
  }, [currentSortBy]);

  // Get sort direction indicator
  const getSortIndicator = useCallback((sortField: typeof sortBy) => {
    if (currentSortBy !== sortField) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }, [currentSortBy, sortDirection]);

  return (
    <div 
      ref={taskListRef}
      className={`task-list ${className} ${isLoading ? 'loading-pulse' : ''}`} 
      data-testid="task-list"
    >
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600 transition-colors"
              >
                <span className="sr-only">閉じる</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sort Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium mb-3">並び替え</h3>
        <div className="flex flex-wrap gap-2">
          <button
            ref={el => sortButtonRefs.current['dueDate'] = el}
            onClick={() => handleSortChange('dueDate')}
            className={getSortButtonClass('dueDate')}
            data-testid="sort-by-due-date"
          >
            期限日{getSortIndicator('dueDate')}
          </button>
          <button
            ref={el => sortButtonRefs.current['freshness'] = el}
            onClick={() => handleSortChange('freshness')}
            className={getSortButtonClass('freshness')}
            data-testid="sort-by-freshness"
          >
            鮮度{getSortIndicator('freshness')}
          </button>
          <button
            ref={el => sortButtonRefs.current['priority'] = el}
            onClick={() => handleSortChange('priority')}
            className={getSortButtonClass('priority')}
            data-testid="sort-by-priority"
          >
            優先度{getSortIndicator('priority')}
          </button>
          <button
            ref={el => sortButtonRefs.current['createdAt'] = el}
            onClick={() => handleSortChange('createdAt')}
            className={getSortButtonClass('createdAt')}
            data-testid="sort-by-created"
          >
            作成日{getSortIndicator('createdAt')}
          </button>
        </div>
      </div>

      {/* Active Tasks Section */}
      {activeTasks.length > 0 && (
        <section className="mb-8" data-testid="active-tasks-section">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            アクティブなタスク ({activeTasks.length})
          </h2>
          <div className="space-y-4">
            {activeTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleTaskEdit}
                onComplete={handleTaskComplete}
                onDelete={handleTaskDelete}
                onReveal={handleReveal}
                isRevealed={revealedTombstones.includes(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tombstone Tasks Section */}
      {tombstoneTasks.length > 0 && (
        <section className="mb-8" data-testid="tombstone-tasks-section">
          <h2 className="text-xl font-bold mb-4 text-gray-600">
            期限切れタスク ({tombstoneTasks.length})
          </h2>
          <div className="space-y-4">
            {tombstoneTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleTaskEdit}
                onComplete={handleTaskComplete}
                onDelete={handleTaskDelete}
                onReveal={handleReveal}
                isRevealed={revealedTombstones.includes(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Tasks Section */}
      {showCompleted && completedTasks.length > 0 && (
        <section className="mb-8" data-testid="completed-tasks-section">
          <h2 className="text-xl font-bold mb-4 text-green-600">
            完了済みタスク ({completedTasks.length})
          </h2>
          <div className="space-y-4 opacity-75">
            {completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleTaskEdit}
                onComplete={handleTaskComplete}
                onDelete={handleTaskDelete}
                onReveal={handleReveal}
                isRevealed={revealedTombstones.includes(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {activeTasks.length === 0 && tombstoneTasks.length === 0 && (!showCompleted || completedTasks.length === 0) && (
        <div className="text-center py-12" data-testid="empty-state">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            タスクがありません
          </h3>
          <p className="text-gray-500">
            新しいタスクを作成して始めましょう
          </p>
        </div>
      )}

      {/* Task Statistics */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg" data-testid="task-statistics">
        <h3 className="text-sm font-medium mb-2">統計</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-blue-600">{activeTasks.length}</div>
            <div className="text-gray-600">アクティブ</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-red-600">{tombstoneTasks.length}</div>
            <div className="text-gray-600">期限切れ</div>
          </div>
          {showCompleted && (
            <div className="text-center">
              <div className="font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-gray-600">完了済み</div>
            </div>
          )}
          <div className="text-center">
            <div className="font-bold text-gray-800">{tasks.length}</div>
            <div className="text-gray-600">合計</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export { TaskList };
export default TaskList;