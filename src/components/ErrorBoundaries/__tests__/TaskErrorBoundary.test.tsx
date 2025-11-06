import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { TaskErrorBoundary, TaskErrorFallback } from '../TaskErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('TaskErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <TaskErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TaskErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error fallback when there is an error', () => {
    render(
      <TaskErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /エラーが発生しました/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /リセット/ })).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <TaskErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('resets error state when reset button is clicked', () => {
    const { rerender } = render(
      <TaskErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByRole('heading', { name: /エラーが発生しました/ })).toBeInTheDocument();

    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /リセット/ }));

    // Re-render with no error
    rerender(
      <TaskErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TaskErrorBoundary>
    );

    // Should show normal content
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('uses custom fallback component when provided', () => {
    const CustomFallback = ({ error, resetError }: any) => (
      <div>
        <span>Custom error: {error.message}</span>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    render(
      <TaskErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </TaskErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Custom Reset/ })).toBeInTheDocument();
  });
});

describe('TaskErrorFallback', () => {
  const mockResetError = vi.fn();

  beforeEach(() => {
    mockResetError.mockClear();
  });

  it('renders task operation error message for task-related errors', () => {
    const taskError = new Error('Task operation failed');
    
    render(
      <TaskErrorFallback error={taskError} resetError={mockResetError} />
    );

    expect(screen.getByText('タスク操作エラー')).toBeInTheDocument();
    expect(screen.getByText(/タスクの操作中にエラーが発生しました/)).toBeInTheDocument();
  });

  it('renders general error message for non-task errors', () => {
    const generalError = new Error('General error');
    
    render(
      <TaskErrorFallback error={generalError} resetError={mockResetError} />
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText(/予期しないエラーが発生しました/)).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Test error with stack');
    error.stack = 'Error: Test error\n    at test.js:1:1';
    
    render(
      <TaskErrorFallback error={error} resetError={mockResetError} />
    );

    expect(screen.getByText('エラー詳細 (開発モード)')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('calls resetError when reset button is clicked', () => {
    const error = new Error('Test error');
    
    render(
      <TaskErrorFallback error={error} resetError={mockResetError} />
    );

    fireEvent.click(screen.getByRole('button', { name: /リセット/ }));
    expect(mockResetError).toHaveBeenCalledTimes(1);
  });

  it('reloads page when reload button is clicked', () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    const error = new Error('Test error');
    
    render(
      <TaskErrorFallback error={error} resetError={mockResetError} />
    );

    fireEvent.click(screen.getByRole('button', { name: /ページをリロード/ }));
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});