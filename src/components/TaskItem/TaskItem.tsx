'use client';

import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import type { TaskItemProps, FreshnessState } from '../../types';
import { VisualEffectWrapper } from '../VisualEffects/VisualEffectWrapper';
import { ParticleEffect } from '../VisualEffects/ParticleEffect';
import { getFreshnessClassName } from '../../lib/visualEffects';
import { format } from 'date-fns';
import { useAnimations } from '../../hooks/useAnimations';

/**
 * TaskItem component with visual states and tombstone functionality
 * Requirements: 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3
 * Optimized with React.memo for performance
 */
const TaskItem = memo(function TaskItem({
  task,
  onEdit,
  onComplete,
  onDelete,
  onReveal,
  isRevealed = false,
  className = '',
}: TaskItemProps) {
  const [isLocalRevealed, setIsLocalRevealed] = useState(isRevealed);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [previousState, setPreviousState] = useState<FreshnessState>(task.freshnessState);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for animation targets
  const taskItemRef = useRef<HTMLDivElement>(null);
  const completeButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  
  // Animation hooks
  const {
    triggerCompletion,
    showSuccess,
    showError,
    showWarning,
    animateTransition,
    setLoading,
    clearLoading,
    enhanceButton,
    removeButtonEnhancement,
  } = useAnimations();

  // Update local revealed state when prop changes
  useEffect(() => {
    setIsLocalRevealed(isRevealed);
  }, [isRevealed]);

  // Track freshness state changes for smooth transitions
  useEffect(() => {
    if (task.freshnessState !== previousState && taskItemRef.current) {
      animateTransition(taskItemRef.current, {
        from: previousState,
        to: task.freshnessState,
      });
      setPreviousState(task.freshnessState);
    }
  }, [task.freshnessState, previousState, animateTransition]);

  // Enhance buttons with interactive feedback
  useEffect(() => {
    const buttons = [completeButtonRef.current, deleteButtonRef.current, editButtonRef.current, saveButtonRef.current];
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
  }, [enhanceButton, removeButtonEnhancement, isEditing]);



  const handleComplete = useCallback(async () => {
    if (isCompleting || !taskItemRef.current) return;
    
    setIsCompleting(true);
    
    try {
      // Trigger completion animation
      await triggerCompletion(taskItemRef.current, {
        duration: 800,
        showConfetti: true,
        onComplete: () => {
          onComplete?.(task.id);
          showSuccess('タスクが完了しました！', 2000);
        },
      });
    } catch (error) {
      showError('タスクの完了に失敗しました');
      setIsCompleting(false);
    }
  }, [isCompleting, onComplete, task.id, triggerCompletion, showSuccess, showError]);

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    if (deleteButtonRef.current) {
      setLoading(deleteButtonRef.current, 'spinner');
    }
    
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onDelete?.(task.id);
      showSuccess('タスクが削除されました');
    } catch (error) {
      showError('タスクの削除に失敗しました');
      setIsDeleting(false);
      
      if (deleteButtonRef.current) {
        clearLoading(deleteButtonRef.current);
      }
    }
  }, [isDeleting, onDelete, task.id, setLoading, clearLoading, showSuccess, showError]);

  const handleEditStart = useCallback(() => {
    setIsEditing(true);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  }, [task.title, task.description]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  }, [task.title, task.description]);

  const handleEditSave = useCallback(async () => {
    if (!editTitle.trim()) {
      showWarning('タイトルを入力してください');
      return;
    }
    
    if (isSaving) return;
    
    setIsSaving(true);
    
    if (saveButtonRef.current) {
      setLoading(saveButtonRef.current, 'spinner');
    }
    
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onEdit?.(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      
      setIsEditing(false);
      showSuccess('タスクが更新されました');
    } catch (error) {
      showError('タスクの更新に失敗しました');
    } finally {
      setIsSaving(false);
      
      if (saveButtonRef.current) {
        clearLoading(saveButtonRef.current);
      }
    }
  }, [editTitle, editDescription, onEdit, task.id, isSaving, setLoading, clearLoading, showSuccess, showError, showWarning]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  }, [handleEditSave, handleEditCancel]);

  // Memoized expensive calculations
  const formattedDueDate = useMemo(() => format(task.dueDate, 'MMM dd, yyyy'), [task.dueDate]);
  const formattedCreatedDate = useMemo(() => format(task.createdAt, 'MMM dd, yyyy'), [task.createdAt]);
  
  const priorityLabel = useMemo(() => {
    const labels = {
      low: '低',
      medium: '中',
      high: '高',
    };
    return labels[task.priority as keyof typeof labels] || task.priority;
  }, [task.priority]);

  const priorityColor = useMemo(() => {
    const colors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    };
    return colors[task.priority as keyof typeof colors] || 'text-gray-600';
  }, [task.priority]);

  const freshnessClassName = useMemo(() => getFreshnessClassName(task.freshnessState), [task.freshnessState]);
  const revealedClassName = isLocalRevealed ? 'revealed' : '';
  
  // Memoized computed values
  const isTombstone = useMemo(() => task.freshnessState === '期限切れ', [task.freshnessState]);
  const shouldShowContent = useMemo(() => !isTombstone || isLocalRevealed, [isTombstone, isLocalRevealed]);

  const handleTombstoneClick = useCallback(() => {
    if (isTombstone && !isLocalRevealed) {
      setIsLocalRevealed(true);
      onReveal?.(task.id);
    }
  }, [isTombstone, isLocalRevealed, onReveal, task.id]);

  return (
    <VisualEffectWrapper
      freshnessState={task.freshnessState}
      className={`task-item ${className}`}
      enableTransitions={true}
      isRevealed={isLocalRevealed}
      onClick={isTombstone && !isLocalRevealed ? handleTombstoneClick : undefined}
    >
      <div
        ref={taskItemRef}
        className={`
          relative p-4 border-2 rounded-lg transition-all duration-300 ease-in-out
          ${freshnessClassName} ${revealedClassName}
          ${isTombstone && !isLocalRevealed ? 'cursor-pointer select-none' : ''}
          ${isCompleting ? 'task-completing' : ''}
          ${isDeleting ? 'loading' : ''}
        `}
        data-testid="task-item"
        data-freshness={task.freshnessState}
        data-revealed={isLocalRevealed}
      >
        {/* Particle Effects */}
        <ParticleEffect 
          freshnessState={task.freshnessState} 
          isActive={!task.completed}
        />

        {/* Tombstone Mode - Hidden Content */}
        {isTombstone && !isLocalRevealed && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">⚰️</div>
            <div className="text-sm opacity-75">
              期限切れタスク - クリックして表示
            </div>
          </div>
        )}

        {/* Normal Content or Revealed Tombstone */}
        {shouldShowContent && (
          <>
            {/* Task Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full text-lg font-semibold bg-transparent border-b-2 border-current focus:outline-none focus:border-opacity-100 border-opacity-50"
                    autoFocus
                    data-testid="task-title-input"
                  />
                ) : (
                  <h3 
                    className={`text-lg font-semibold truncate ${task.completed ? 'line-through opacity-60' : ''}`}
                    data-testid="task-title"
                  >
                    {task.title}
                  </h3>
                )}
                
                {/* Priority Badge */}
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className={`text-xs px-2 py-1 rounded-full bg-current bg-opacity-10 ${priorityColor}`}
                    data-testid="task-priority"
                  >
                    優先度: {priorityLabel}
                  </span>
                  <span className="text-xs opacity-75" data-testid="task-freshness">
                    状態: {task.freshnessState}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {!task.completed && (
                <div className="flex gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        ref={saveButtonRef}
                        onClick={handleEditSave}
                        disabled={isSaving}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                        data-testid="save-button"
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        data-testid="cancel-button"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        ref={editButtonRef}
                        onClick={handleEditStart}
                        disabled={isCompleting || isDeleting}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="edit-button"
                      >
                        編集
                      </button>
                      <button
                        ref={completeButtonRef}
                        onClick={handleComplete}
                        disabled={isCompleting || isDeleting}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                        data-testid="complete-button"
                      >
                        {isCompleting ? '完了中...' : '完了'}
                      </button>
                      <button
                        ref={deleteButtonRef}
                        onClick={handleDelete}
                        disabled={isCompleting || isDeleting}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                        data-testid="delete-button"
                      >
                        {isDeleting ? '削除中...' : '削除'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Task Description */}
            {(task.description || isEditing) && (
              <div className="mb-3">
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="説明を入力..."
                    className="w-full p-2 text-sm bg-transparent border border-current border-opacity-30 rounded focus:outline-none focus:border-opacity-100 resize-none"
                    rows={3}
                    data-testid="task-description-input"
                  />
                ) : (
                  <p 
                    className={`text-sm opacity-80 ${task.completed ? 'line-through' : ''}`}
                    data-testid="task-description"
                  >
                    {task.description}
                  </p>
                )}
              </div>
            )}

            {/* Task Footer */}
            <div className="flex items-center justify-between text-xs opacity-75">
              <div className="flex items-center gap-4">
                <span data-testid="task-due-date">
                  期限: {formattedDueDate}
                </span>
                <span data-testid="task-created-date">
                  作成: {formattedCreatedDate}
                </span>
              </div>
              
              {task.completed && (
                <span className="text-green-600 font-medium" data-testid="completed-badge">
                  ✓ 完了
                </span>
              )}
            </div>

            {/* Tombstone Revival Hint */}
            {isTombstone && isLocalRevealed && (
              <div className="mt-3 p-2 bg-yellow-100 bg-opacity-20 rounded text-xs text-center">
                このタスクは期限切れです。編集して期限を更新することで復活できます。
              </div>
            )}
          </>
        )}
      </div>
    </VisualEffectWrapper>
  );
});

export { TaskItem };
export default TaskItem;