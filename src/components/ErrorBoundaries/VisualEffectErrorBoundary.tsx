'use client';

import React, { Component, ReactNode } from 'react';
import type { ErrorBoundaryProps, ErrorFallbackProps } from '../../types';

interface VisualEffectErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * Error boundary specifically for visual effects and animations
 * Requirements: All requirements need proper error handling
 */
export class VisualEffectErrorBoundary extends Component<ErrorBoundaryProps, VisualEffectErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<VisualEffectErrorBoundaryState> {
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
    console.error('VisualEffectErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Auto-retry for certain types of visual effect errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production visual effect error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  shouldAutoRetry(error: Error): boolean {
    // Auto-retry for common visual effect errors
    const retryableErrors = [
      'Animation',
      'CSS',
      'transition',
      'transform',
      'requestAnimationFrame',
      'getComputedStyle',
    ];

    return retryableErrors.some(keyword => 
      error.message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  scheduleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000;

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }, delay);
  };

  handleManualReset = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || VisualEffectErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.handleManualReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default fallback component for visual effect errors
 */
export function VisualEffectErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isAnimationError = error.message.toLowerCase().includes('animation') ||
                          error.message.toLowerCase().includes('transition') ||
                          error.message.toLowerCase().includes('css');

  return (
    <div className="visual-effect-error-fallback p-4 border border-yellow-200 rounded-md bg-yellow-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 text-sm">⚡</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">
            {isAnimationError ? 'アニメーションエラー' : 'ビジュアルエフェクトエラー'}
          </h4>
          
          <div className="text-xs text-yellow-700 mb-3">
            {isAnimationError ? (
              <p>
                アニメーションの実行中にエラーが発生しました。
                基本的な表示に切り替えて続行します。
              </p>
            ) : (
              <p>
                ビジュアルエフェクトでエラーが発生しました。
                シンプルな表示モードで続行します。
              </p>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mb-3">
              <summary className="text-xs font-medium text-yellow-800 cursor-pointer hover:text-yellow-900">
                エラー詳細
              </summary>
              <div className="mt-1 p-2 bg-yellow-100 rounded text-xs font-mono text-yellow-800 overflow-auto max-h-32">
                {error.message}
              </div>
            </details>
          )}

          <button
            onClick={resetError}
            className="px-3 py-1 bg-yellow-600 text-white text-xs font-medium rounded hover:bg-yellow-700 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-colors"
          >
            エフェクトを再試行
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified visual effect wrapper that disables effects on error
 */
export function SafeVisualEffectWrapper({ 
  children, 
  className = '',
  fallbackClassName = 'simple-task-item',
}: {
  children: ReactNode;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <VisualEffectErrorBoundary
      fallback={({ resetError }) => (
        <div className={`${fallbackClassName} ${className}`}>
          <div className="p-2 mb-2 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600">
            ビジュアルエフェクトが無効になっています
            <button 
              onClick={resetError}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              再有効化
            </button>
          </div>
          {children}
        </div>
      )}
    >
      {children}
    </VisualEffectErrorBoundary>
  );
}

export default VisualEffectErrorBoundary;