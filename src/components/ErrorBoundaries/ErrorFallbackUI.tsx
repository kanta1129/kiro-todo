'use client';

import React from 'react';
import type { ErrorFallbackProps } from '../../types';

/**
 * Reusable error fallback UI components
 * Requirements: All requirements need proper error handling
 */

export interface ErrorFallbackUIProps extends ErrorFallbackProps {
  title?: string;
  description?: string;
  showDetails?: boolean;
  showReload?: boolean;
  variant?: 'default' | 'minimal' | 'inline';
}

export function ErrorFallbackUI({
  error,
  resetError,
  title = 'エラーが発生しました',
  description,
  showDetails = process.env.NODE_ENV === 'development',
  showReload = true,
  variant = 'default',
}: ErrorFallbackUIProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return {
          container: 'p-3 border border-red-200 rounded bg-red-50',
          icon: 'w-5 h-5 text-red-500',
          title: 'text-sm font-medium text-red-800',
          description: 'text-xs text-red-700',
          button: 'px-2 py-1 text-xs',
        };
      case 'inline':
        return {
          container: 'p-2 border-l-4 border-red-400 bg-red-50',
          icon: 'w-4 h-4 text-red-500',
          title: 'text-xs font-medium text-red-800',
          description: 'text-xs text-red-600',
          button: 'px-2 py-1 text-xs',
        };
      default:
        return {
          container: 'p-6 border-2 border-red-200 rounded-lg bg-red-50',
          icon: 'w-8 h-8 text-red-600',
          title: 'text-lg font-medium text-red-800',
          description: 'text-sm text-red-700',
          button: 'px-4 py-2 text-sm',
        };
    }
  };

  const styles = getVariantStyles();

  const defaultDescription = description || 
    '予期しないエラーが発生しました。リセットボタンを押して再試行してください。';

  return (
    <div className={`error-fallback-ui ${styles.container}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`${styles.icon} flex items-center justify-center`}>
            <span>⚠️</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`${styles.title} mb-2`}>
            {title}
          </h3>
          
          <div className={`${styles.description} mb-4`}>
            <p>{defaultDescription}</p>
          </div>

          {showDetails && (
            <details className="mb-4">
              <summary className={`${styles.description} font-medium cursor-pointer hover:opacity-80`}>
                エラー詳細
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex space-x-2">
            <button
              onClick={resetError}
              className={`${styles.button} bg-red-600 text-white font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors`}
            >
              リセット
            </button>
            
            {showReload && (
              <button
                onClick={() => window.location.reload()}
                className={`${styles.button} bg-gray-600 text-white font-medium rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors`}
              >
                リロード
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact error display for inline use
 */
export function InlineErrorDisplay({ 
  error, 
  onRetry,
  className = '',
}: { 
  error: string | Error; 
  onRetry?: () => void;
  className?: string;
}) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`inline-error-display flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 ${className}`}>
      <span className="text-red-500">⚠️</span>
      <span className="flex-1">{errorMessage}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          再試行
        </button>
      )}
    </div>
  );
}

/**
 * Loading state with error fallback
 */
export function LoadingWithError({
  isLoading,
  error,
  onRetry,
  children,
  loadingText = '読み込み中...',
}: {
  isLoading: boolean;
  error: string | Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingText?: string;
}) {
  if (error) {
    return (
      <InlineErrorDisplay 
        error={error} 
        onRetry={onRetry}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="loading-with-error flex items-center space-x-2 p-4 text-gray-600">
        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
        <span>{loadingText}</span>
      </div>
    );
  }

  return <>{children}</>;
}

export default ErrorFallbackUI;