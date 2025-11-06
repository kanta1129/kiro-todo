'use client';

import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { CreateTaskInput, TaskPriority } from '../../types';
import { CreateTaskInputSchema } from '../../types/task';
import { useTaskStore } from '../../stores/taskStore';
import { useAnimations } from '../../hooks/useAnimations';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { InlineErrorDisplay } from '../ErrorBoundaries';
import { z } from 'zod';

interface TaskFormProps {
  onSubmit?: (task: CreateTaskInput) => void;
  onCancel?: () => void;
  initialValues?: Partial<CreateTaskInput>;
  isEditing?: boolean;
  isLoading?: boolean;
  className?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  general?: string;
}

const TaskForm = memo(function TaskForm({
  onSubmit,
  onCancel,
  initialValues,
  isEditing = false,
  isLoading = false,
  className = '',
}: TaskFormProps) {
  // Form state
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    dueDate: initialValues?.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    priority: initialValues?.priority || 'medium',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for animation targets
  const formRef = useRef<HTMLFormElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Task store actions
  const { addTask, error: storeError, clearError } = useTaskStore();

  // Animation hooks
  const {
    showSuccess,
    showError,
    showWarning,
    setLoading,
    clearLoading,
    enhanceButton,
    removeButtonEnhancement,
  } = useAnimations();

  // Error handling
  const {
    error: formError,
    isRecovering,
    clearError: clearFormError,
    withErrorHandling,
    withAsyncErrorHandling,
  } = useErrorHandler({
    componentName: 'TaskForm',
    enableAutoRecovery: true,
    onError: (error, classification) => {
      if (classification.type === 'validation') {
        showWarning('入力データを確認してください');
      } else {
        showError('フォームでエラーが発生しました');
      }
    },
  });

  // Update form data when initial values change (for editing)
  useEffect(() => {
    if (initialValues) {
      setFormData({
        title: initialValues.title || '',
        description: initialValues.description || '',
        dueDate: initialValues.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: initialValues.priority || 'medium',
      });
    }
  }, [initialValues]);

  // Clear store errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Enhance submit button with interactive feedback
  useEffect(() => {
    const button = submitButtonRef.current;
    if (button) {
      enhanceButton(button);
    }

    return () => {
      if (button) {
        removeButtonEnhancement(button);
      }
    };
  }, [enhanceButton, removeButtonEnhancement]);

  // Memoized validation function
  const validateForm = useCallback((): boolean => {
    try {
      // Validate the form data
      const validationData = {
        ...formData,
        // Ensure dueDate is a valid Date object
        dueDate: formData.dueDate instanceof Date ? formData.dueDate : new Date(formData.dueDate),
      };
      
      CreateTaskInputSchema.parse(validationData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues?.forEach((err: any) => {
          const field = err.path[0] as keyof FormErrors;
          if (field && typeof field === 'string') {
            (newErrors as any)[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData]);

  // Handle input changes
  const handleInputChange = (field: keyof CreateTaskInput, value: any) => {
    setFormData((prev: CreateTaskInput) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific error when user starts typing
    if (field && typeof field === 'string' && (errors as any)[field]) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showWarning('入力内容を確認してください');
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    clearFormError();

    // Add loading state to submit button
    if (submitButtonRef.current) {
      setLoading(submitButtonRef.current, 'spinner');
    }

    try {
      await withAsyncErrorHandling(async () => {
        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        if (onSubmit) {
          // Use custom onSubmit handler if provided
          onSubmit(formData);
        } else {
          // Use store action for creating new tasks
          addTask(formData);
        }

        // Show success message
        const successMessage = isEditing ? 'タスクが更新されました' : 'タスクが作成されました';
        showSuccess(successMessage);

        // Reset form after successful submission (only for new tasks)
        if (!isEditing) {
          setFormData({
            title: '',
            description: '',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            priority: 'medium',
          });
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'タスクの保存中にエラーが発生しました';
      setErrors({
        general: errorMessage,
      });
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
      
      // Remove loading state from submit button
      if (submitButtonRef.current) {
        clearLoading(submitButtonRef.current);
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form to initial values
      setFormData({
        title: initialValues?.title || '',
        description: initialValues?.description || '',
        dueDate: initialValues?.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: initialValues?.priority || 'medium',
      });
      setErrors({});
    }
  };

  // Memoized date formatting functions
  const formatDateForInput = useCallback((date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      // Return a default future date if invalid
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  const parseDateFromInput = useCallback((dateString: string): Date => {
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : parsed;
  }, []);

  // Memoized computed values
  const isFormLoading = useMemo(() => isLoading || isSubmitting, [isLoading, isSubmitting]);
  const displayError = useMemo(() => errors.general || storeError, [errors.general, storeError]);
  const formattedDueDate = useMemo(() => formatDateForInput(formData.dueDate), [formData.dueDate, formatDateForInput]);
  const minDate = useMemo(() => formatDateForInput(new Date()), [formatDateForInput]);

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className={`bg-white rounded-lg shadow-md p-6 space-y-4 transition-all duration-300 ${className} ${isSubmitting ? 'loading-pulse' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h2>
      </div>

      {/* General Error Display */}
      {displayError && (
        <InlineErrorDisplay 
          error={displayError} 
          onRetry={clearFormError}
          className="mb-4"
        />
      )}

      {/* Form Error Display */}
      {formError && (
        <InlineErrorDisplay 
          error={formError} 
          onRetry={clearFormError}
          className="mb-4"
        />
      )}

      {/* Recovery Status */}
      {isRecovering && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <p className="text-blue-600 text-sm">エラーから復旧中...</p>
        </div>
      )}

      {/* Title Field */}
      <div className="space-y-1">
        <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter task title..."
          disabled={isFormLoading}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          maxLength={200}
        />
        {errors.title && (
          <p className="text-red-600 text-xs mt-1">{errors.title}</p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-1">
        <label htmlFor="task-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="task-description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter task description (optional)..."
          disabled={isFormLoading}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical ${
            errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          maxLength={1000}
        />
        {errors.description && (
          <p className="text-red-600 text-xs mt-1">{errors.description}</p>
        )}
        <p className="text-gray-500 text-xs">
          {formData.description.length}/1000 characters
        </p>
      </div>

      {/* Due Date Field */}
      <div className="space-y-1">
        <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700">
          Due Date <span className="text-red-500">*</span>
        </label>
        <input
          id="task-due-date"
          type="datetime-local"
          value={formattedDueDate}
          onChange={(e) => handleInputChange('dueDate', parseDateFromInput(e.target.value))}
          disabled={isFormLoading}
          min={minDate}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        />
        {errors.dueDate && (
          <p className="text-red-600 text-xs mt-1">{errors.dueDate}</p>
        )}
      </div>

      {/* Priority Field */}
      <div className="space-y-1">
        <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700">
          Priority <span className="text-red-500">*</span>
        </label>
        <select
          id="task-priority"
          value={formData.priority}
          onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
          disabled={isFormLoading}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.priority ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        {errors.priority && (
          <p className="text-red-600 text-xs mt-1">{errors.priority}</p>
        )}
        <p className="text-gray-500 text-xs">
          Higher priority tasks decay faster and require more attention
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isFormLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          ref={submitButtonRef}
          type="submit"
          disabled={isFormLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 relative transition-all duration-200"
        >
          <span>{isEditing ? (isSubmitting ? 'タスクを更新中...' : 'タスクを更新') : (isSubmitting ? 'タスクを作成中...' : 'タスクを作成')}</span>
        </button>
      </div>
    </form>
  );
});

export { TaskForm };
export default TaskForm;