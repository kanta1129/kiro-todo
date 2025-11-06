'use client';

import React, { Component, ReactNode } from 'react';
import type { ErrorBoundaryProps, ErrorFallbackProps } from '../../types';

interface TaskErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary for task-related components and operations
 * Requirements: All requirements need proper error handling
 */
export class TaskErrorBoundary extends Component<ErrorBoundaryProps, TaskErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<TaskErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error('TaskErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (e.g., Sentry)
      console.error('Production error in TaskErrorBoundary:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || TaskErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default fallback component for task errors
 */
export function TaskErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isTaskOperationError = error.message.includes('Task') || 
                              error.message.includes('task') ||
                              error.message.includes('タスク');

  return (
    <div className="task-error-fallback p-6 border-2 border-red-200 rounded-lg bg-red-50">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-lg">⚠️</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            {isTaskOperationError ? 'タスク操作エラー' : 'エラーが発生しました'}
          </h3>
          
          <div className="text-sm text-red-700 mb-4">
            {isTaskOperationError ? (
              <p>
                タスクの操作中にエラーが発生しました。データが破損している可能性があります。
                リセットボタンを押して再試行してください。
              </p>
            ) : (
              <p>
                予期しないエラーが発生しました。ページをリロードするか、
                リセットボタンを押して再試行してください。
              </p>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4">
              <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                エラー詳細 (開発モード)
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex space-x-3">
            <button
              onClick={resetError}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              リセット
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              ページをリロード
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskErrorBoundary;