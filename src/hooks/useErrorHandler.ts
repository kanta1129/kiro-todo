import { useState, useCallback, useRef } from 'react';
import { errorRecoveryService, type RecoveryResult } from '../lib/errorRecovery';
import { classifyError } from '../lib/dataValidation';

/**
 * Hook for handling errors with automatic recovery
 * Requirements: All requirements need proper error handling
 */

export interface UseErrorHandlerOptions {
  componentName?: string;
  enableAutoRecovery?: boolean;
  maxRetries?: number;
  onError?: (error: Error, classification: ReturnType<typeof classifyError>) => void;
  onRecovery?: (result: RecoveryResult) => void;
}

export interface UseErrorHandlerReturn {
  error: Error | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  clearError: () => void;
  handleError: (error: Error) => Promise<boolean>;
  withErrorHandling: <T>(operation: () => T, fallback?: T) => T;
  withAsyncErrorHandling: <T>(operation: () => Promise<T>) => Promise<T>;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    componentName = 'UnknownComponent',
    enableAutoRecovery = true,
    maxRetries = 3,
    onError,
    onRecovery,
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const lastErrorRef = useRef<string>('');

  const clearError = useCallback(() => {
    setError(null);
    setRecoveryAttempts(0);
    lastErrorRef.current = '';
  }, []);

  const handleError = useCallback(async (error: Error): Promise<boolean> => {
    const errorKey = `${error.name}_${error.message}`;
    
    // Avoid duplicate error handling
    if (lastErrorRef.current === errorKey) {
      return false;
    }
    
    lastErrorRef.current = errorKey;
    setError(error);

    // Classify the error
    const classification = classifyError(error);
    
    // Call custom error handler
    onError?.(error, classification);

    // Attempt automatic recovery if enabled and error is recoverable
    if (enableAutoRecovery && classification.recoverable && recoveryAttempts < maxRetries) {
      setIsRecovering(true);
      setRecoveryAttempts(prev => prev + 1);

      try {
        const recoveryResult = await errorRecoveryService.handleComponentError(
          error,
          componentName,
          { maxRetries }
        );

        onRecovery?.(recoveryResult);

        if (recoveryResult.success) {
          clearError();
          return true;
        }
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      } finally {
        setIsRecovering(false);
      }
    }

    return false;
  }, [componentName, enableAutoRecovery, maxRetries, recoveryAttempts, onError, onRecovery, clearError]);

  const withErrorHandling = useCallback(<T>(
    operation: () => T,
    fallback?: T
  ): T => {
    try {
      return operation();
    } catch (error) {
      handleError(error as Error);
      
      if (fallback !== undefined) {
        return fallback;
      }
      
      throw error;
    }
  }, [handleError]);

  const withAsyncErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      const recovered = await handleError(error as Error);
      
      if (recovered) {
        // Retry once after successful recovery
        try {
          return await operation();
        } catch (retryError) {
          throw retryError;
        }
      }
      
      throw error;
    }
  }, [handleError]);

  return {
    error,
    isRecovering,
    recoveryAttempts,
    clearError,
    handleError,
    withErrorHandling,
    withAsyncErrorHandling,
  };
}

export default useErrorHandler;