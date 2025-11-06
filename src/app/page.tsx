'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { TaskList } from '../components/TaskList/TaskList';
import TaskForm from '../components/TaskForm/TaskForm';
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary';
import { RealTimeStatus } from '../components/RealTimeStatus/RealTimeStatus';
import { RealTimeMetrics } from '../components/RealTimeMetrics/RealTimeMetrics';
import { useTaskStore } from '../stores/taskStore';
import { useAnimations } from '../hooks/useAnimations';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import type { CreateTaskInput, UpdateTaskInput, FreshnessState, TaskPriority } from '../types';

export default function Home() {
  // Task store state and actions
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    updateFreshnessStates,
    error,
    clearError,
  } = useTaskStore();

  // Local state for UI
  const [showCompleted, setShowCompleted] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation hooks
  const { showSuccess, showError, showInfo } = useAnimations();

  // Real-time updates hook with enhanced configuration
  const realTimeUpdates = useRealTimeUpdates({
    updateInterval: 60000, // 1 minute
    debounceDelay: 1000,   // 1 second
    updateOnMount: true,
    pauseOnHidden: true,
  });

  // Extract real-time update data for UI feedback
  const {
    isActive: isRealTimeActive,
    isUpdating: isRealTimeUpdating,
    lastUpdateCount,
    timeUntilNextUpdate,
    getPerformanceMetrics,
  } = realTimeUpdates;

  // Enhanced real-time update management
  useEffect(() => {
    // Initial freshness update
    updateFreshnessStates();
    
    // The real-time updates hook handles periodic updates automatically
    // No need for manual interval setup here
    
    // Set up adaptive update intervals based on task urgency
    const checkUrgentTasks = () => {
      const urgentTasks = tasks.filter(task => {
        if (task.completed) return false;
        const timeUntilDue = new Date(task.dueDate).getTime() - Date.now();
        return timeUntilDue < 2 * 60 * 60 * 1000; // Less than 2 hours
      });

      // If there are urgent tasks, we might want more frequent updates
      if (urgentTasks.length > 0 && !isRealTimeUpdating) {
        console.log(`Found ${urgentTasks.length} urgent tasks, ensuring real-time updates are active`);
      }
    };

    // Check for urgent tasks every 30 seconds
    const urgentCheckInterval = setInterval(checkUrgentTasks, 30000);

    return () => {
      clearInterval(urgentCheckInterval);
    };
  }, [updateFreshnessStates, tasks, isRealTimeUpdating]);

  // Memoized task filtering for performance
  const { activeTasks, completedTasks } = useMemo(() => {
    const active = tasks.filter(task => !task.completed);
    const completed = tasks.filter(task => task.completed);
    return { activeTasks: active, completedTasks: completed };
  }, [tasks]);

  // Memoized statistics calculation
  const statistics = useMemo(() => {
    const freshnessStats = activeTasks.reduce((acc, task) => {
      acc[task.freshnessState] = (acc[task.freshnessState] || 0) + 1;
      return acc;
    }, {} as Record<FreshnessState, number>);

    const priorityStats = activeTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<TaskPriority, number>);

    const overdueTasks = freshnessStats['期限切れ'] || 0;
    const urgentTasks = freshnessStats['期限間近'] || 0;
    const approachingTasks = freshnessStats['期限接近'] || 0;
    const freshTasks = freshnessStats['新規'] || 0;

    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    return {
      total: tasks.length,
      active: activeTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks,
      urgent: urgentTasks,
      approaching: approachingTasks,
      fresh: freshTasks,
      completionRate,
      freshnessStats,
      priorityStats,
    };
  }, [tasks, activeTasks, completedTasks]);

  // Memoized event handlers for performance
  const handleTaskCreate = useCallback(async (taskInput: CreateTaskInput) => {
    try {
      addTask(taskInput);
      setShowTaskForm(false);
      showSuccess('新しいタスクが作成されました！');
    } catch (error) {
      showError('タスクの作成に失敗しました');
    }
  }, [addTask, showSuccess, showError]);

  const handleTaskEdit = useCallback(async (id: string, updates: UpdateTaskInput) => {
    try {
      updateTask(id, updates);
      setEditingTask(null);
      showSuccess('タスクが更新されました');
    } catch (error) {
      showError('タスクの更新に失敗しました');
    }
  }, [updateTask, showSuccess, showError]);

  const handleTaskComplete = useCallback(async (id: string) => {
    try {
      completeTask(id);
    } catch (error) {
      showError('タスクの完了に失敗しました');
    }
  }, [completeTask, showError]);

  const handleTaskDelete = useCallback(async (id: string) => {
    try {
      deleteTask(id);
    } catch (error) {
      showError('タスクの削除に失敗しました');
    }
  }, [deleteTask, showError]);

  // Enhanced freshness refresh with real-time integration
  const handleRefreshFreshness = async () => {
    if (isRefreshing || isRealTimeUpdating) return;
    
    setIsRefreshing(true);
    try {
      // Use the real-time updater's force update for better performance
      const updatedCount = await realTimeUpdates.forceUpdate();
      
      if (updatedCount > 0) {
        showSuccess(`${updatedCount}個のタスクの鮮度が更新されました`);
      } else {
        showInfo('すべてのタスクは最新の状態です');
      }
      
      // Get performance metrics for debugging
      const metrics = getPerformanceMetrics();
      console.log('Freshness update performance:', metrics);
      
    } catch (error) {
      showError('鮮度の更新に失敗しました');
      console.error('Freshness update error:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Add small delay for better UX
    }
  };

  // Memoized editing task data
  const editingTaskData = useMemo(() => 
    editingTask ? tasks.find(task => task.id === editingTask) : null, 
    [editingTask, tasks]
  );

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
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
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Status */}
      <div className="mb-6">
        <RealTimeStatus 
          showDetails={false}
          showControls={true}
          compact={false}
          className="mb-4"
        />
        
        {/* Real-time Performance Metrics (for debugging) */}
        <RealTimeMetrics 
          showDetails={false}
          className="mt-2"
        />
      </div>

      {/* Statistics Dashboard */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">タスク統計</h2>
          <RealTimeStatus 
            showDetails={false}
            showControls={false}
            compact={true}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Total Tasks */}
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
            <div className="text-sm text-gray-500">総タスク数</div>
          </div>

          {/* Active Tasks */}
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statistics.active}</div>
            <div className="text-sm text-gray-500">アクティブ</div>
          </div>

          {/* Fresh Tasks */}
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statistics.fresh}</div>
            <div className="text-sm text-gray-500">新規</div>
          </div>

          {/* Approaching Tasks */}
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statistics.approaching}</div>
            <div className="text-sm text-gray-500">期限接近</div>
          </div>

          {/* Urgent Tasks */}
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{statistics.urgent}</div>
            <div className="text-sm text-gray-500">期限間近</div>
          </div>

          {/* Overdue Tasks */}
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statistics.overdue}</div>
            <div className="text-sm text-gray-500">期限切れ</div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">完了率</span>
            <span className="text-sm text-gray-500">{statistics.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${statistics.completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowTaskForm(!showTaskForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showTaskForm ? 'フォームを閉じる' : '新しいタスクを作成'}
        </button>

        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showCompleted ? '完了済みを非表示' : '完了済みを表示'}
          {statistics.completed > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {statistics.completed}
            </span>
          )}
        </button>

        <button
          onClick={handleRefreshFreshness}
          disabled={isRefreshing || isRealTimeUpdating}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <svg className={`-ml-1 mr-2 h-5 w-5 ${(isRefreshing || isRealTimeUpdating) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? '更新中...' : 
           isRealTimeUpdating ? 'リアルタイム更新中...' : 
           '鮮度を更新'}
        </button>

        {/* Real-time status indicator */}
        <div className="inline-flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-md">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isRealTimeUpdating ? 'bg-yellow-400 animate-pulse' : 
            isRealTimeActive ? 'bg-green-400' : 'bg-gray-400'
          }`} />
          <span>
            {isRealTimeUpdating ? 'リアルタイム更新中' : 
             isRealTimeActive ? `次回更新: ${Math.ceil(timeUntilNextUpdate / 1000)}秒` : 
             'リアルタイム更新停止中'}
          </span>
          {lastUpdateCount > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              (前回: {lastUpdateCount}件更新)
            </span>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Form */}
        {(showTaskForm || editingTask) && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <TaskForm
                onSubmit={editingTask ? (taskInput) => handleTaskEdit(editingTask, taskInput) : handleTaskCreate}
                onCancel={() => {
                  setShowTaskForm(false);
                  setEditingTask(null);
                }}
                initialValues={editingTaskData ? {
                  title: editingTaskData.title,
                  description: editingTaskData.description,
                  dueDate: editingTaskData.dueDate,
                  priority: editingTaskData.priority,
                } : undefined}
                isEditing={!!editingTask}
                className="mb-6"
              />
            </div>
          </div>
        )}

        {/* Task List */}
        <div className={`${(showTaskForm || editingTask) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-6xl mb-4">🍃</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                タスクがありません
              </h3>
              <p className="text-gray-500 mb-6">
                新しいタスクを作成して、鮮度管理を始めましょう
              </p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                最初のタスクを作成
              </button>
            </div>
          ) : (
            <ErrorBoundary fallback={
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">タスクリストの読み込み中にエラーが発生しました。</p>
              </div>
            }>
              <TaskList
                tasks={tasks}
                onTaskEdit={(id) => {
                  setEditingTask(id);
                  setShowTaskForm(false);
                }}
                onTaskComplete={handleTaskComplete}
                onTaskDelete={handleTaskDelete}
                showCompleted={showCompleted}
                sortBy="freshness"
              />
            </ErrorBoundary>
          )}
        </div>
      </div>

      {/* Mobile-specific improvements */}
      <div className="block sm:hidden mt-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">クイック統計</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">アクティブなタスク:</span>
              <span className="font-medium">{statistics.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">期限切れ:</span>
              <span className="font-medium text-red-600">{statistics.overdue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">完了率:</span>
              <span className="font-medium text-green-600">{statistics.completionRate}%</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}