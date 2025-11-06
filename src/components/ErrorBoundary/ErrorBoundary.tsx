/**
 * Error Boundary component for handling React errors gracefully
 * Requirements: 4.2, 4.4, 5.3
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <svg className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800">エラーが発生しました</h2>
          </div>
          
          <p className="text-red-700 mb-4">
            申し訳ございませんが、予期しないエラーが発生しました。ページを再読み込みしてお試しください。
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4">
              <summary className="cursor-pointer text-red-600 font-medium">
                エラー詳細 (開発環境のみ)
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            ページを再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;