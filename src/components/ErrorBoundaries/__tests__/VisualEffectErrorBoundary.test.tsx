import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { VisualEffectErrorBoundary, VisualEffectErrorFallback, SafeVisualEffectWrapper } from '../VisualEffectErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Component that throws different types of errors
const ThrowError = ({ 
  shouldThrow = false, 
  errorType = 'general' 
}: { 
  shouldThrow?: boolean;
  errorType?: 'general' | 'animation' | 'css';
}) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'animation':
        throw new Error('Animation failed to start');
      case 'css':
        throw new Error('CSS transition error');
      default:
        throw new Error('General error');
    }
  }
  return <div>Visual effect content</div>;
};

describe('VisualEffectErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders children when there is no error', () => {
    render(
      <VisualEffectErrorBoundary>
        <ThrowError shouldThrow={false} />
      </VisualEffectErrorBoundary>
    );

    expect(screen.getByText('Visual effect content')).toBeInTheDocument();
  });

  it('renders error fallback when there is an error', () => {
    render(
      <VisualEffectErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VisualEffectErrorBoundary>
    );

    expect(screen.getByText(/ビジュアルエフェクトエラー/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /エフェクトを再試行/ })).toBeInTheDocument();
  });

  it('auto-retries for animation errors', async () => {
    const { rerender } = render(
      <VisualEffectErrorBoundary>
        <ThrowError shouldThrow={true} errorType="animation" />
      </VisualEffectErrorBoundary>
    );

    // Error should be displayed initially
    expect(screen.getByText(/アニメーションエラー/)).toBeInTheDocument();

    // Fast-forward time to trigger auto-retry
    vi.advanceTimersByTime(1000);

    // Re-render with no error to simulate successful retry
    rerender(
      <VisualEffectErrorBoundary>
        <ThrowError shouldThrow={false} />
      </VisualEffectErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Visual effect content')).toBeInTheDocument();
    });
  });

  it('does not auto-retry for non-retryable errors', () => {
    render(
      <VisualEffectErrorBoundary>
        <ThrowError shouldThrow={true} errorType="general" />
      </VisualEffectErrorBoundary>
    );

    expect(screen.getByText(/ビジュアルエフェクトエラー/)).toBeInTheDocument();

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    // Error should still be displayed (no auto-retry)
    expect(screen.getByText(/ビジュアルエフェクトエラー/)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <VisualEffectErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </VisualEffectErrorBoundary>
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
      <VisualEffectErrorBoundary>
        <ThrowError shouldThrow={true} />
      </VisualEffectErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText(/ビジュアルエフェクトエラー/)).toBeInTheDocument();

    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /エフェクトを再試行/ }));

    // Re-render with no error
    rerender(
      <VisualEffectErrorBoundary>
        <ThrowError shouldThrow={false} />
      </VisualEffectErrorBoundary>
    );

    // Should show normal content
    expect(screen.getByText('Visual effect content')).toBeInTheDocument();
  });
});

describe('VisualEffectErrorFallback', () => {
  const mockResetError = vi.fn();

  beforeEach(() => {
    mockResetError.mockClear();
  });

  it('renders animation error message for animation-related errors', () => {
    const animationError = new Error('Animation transition failed');
    
    render(
      <VisualEffectErrorFallback error={animationError} resetError={mockResetError} />
    );

    expect(screen.getByText('アニメーションエラー')).toBeInTheDocument();
    expect(screen.getByText(/アニメーションの実行中にエラーが発生しました/)).toBeInTheDocument();
  });

  it('renders general visual effect error message for other errors', () => {
    const generalError = new Error('General visual error');
    
    render(
      <VisualEffectErrorFallback error={generalError} resetError={mockResetError} />
    );

    expect(screen.getByText('ビジュアルエフェクトエラー')).toBeInTheDocument();
    expect(screen.getByText(/ビジュアルエフェクトでエラーが発生しました/)).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Test visual effect error');
    
    render(
      <VisualEffectErrorFallback error={error} resetError={mockResetError} />
    );

    expect(screen.getByText('エラー詳細')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('calls resetError when retry button is clicked', () => {
    const error = new Error('Test error');
    
    render(
      <VisualEffectErrorFallback error={error} resetError={mockResetError} />
    );

    fireEvent.click(screen.getByRole('button', { name: /エフェクトを再試行/ }));
    expect(mockResetError).toHaveBeenCalledTimes(1);
  });
});

describe('SafeVisualEffectWrapper', () => {
  it('renders children normally when there is no error', () => {
    render(
      <SafeVisualEffectWrapper>
        <div>Safe content</div>
      </SafeVisualEffectWrapper>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders fallback with disabled effects message when error occurs', () => {
    render(
      <SafeVisualEffectWrapper>
        <ThrowError shouldThrow={true} />
      </SafeVisualEffectWrapper>
    );

    expect(screen.getByText('ビジュアルエフェクトが無効になっています')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /再有効化/ })).toBeInTheDocument();
  });

  it('applies custom fallback className', () => {
    const { container } = render(
      <SafeVisualEffectWrapper fallbackClassName="custom-fallback">
        <ThrowError shouldThrow={true} />
      </SafeVisualEffectWrapper>
    );

    expect(container.querySelector('.custom-fallback')).toBeInTheDocument();
  });

  it('allows re-enabling effects after error', () => {
    const { rerender } = render(
      <SafeVisualEffectWrapper>
        <ThrowError shouldThrow={true} />
      </SafeVisualEffectWrapper>
    );

    // Error state should be displayed
    expect(screen.getByText('ビジュアルエフェクトが無効になっています')).toBeInTheDocument();

    // Click re-enable button
    fireEvent.click(screen.getByRole('button', { name: /再有効化/ }));

    // Re-render with no error
    rerender(
      <SafeVisualEffectWrapper>
        <ThrowError shouldThrow={false} />
      </SafeVisualEffectWrapper>
    );

    // Should show normal content
    expect(screen.getByText('Visual effect content')).toBeInTheDocument();
  });
});