/**
 * Custom hook for managing animations and user feedback
 * Requirements: 4.2, 4.4, 5.3
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  triggerCompletionAnimation,
  showFeedback,
  animateStateTransition,
  addLoadingState,
  removeLoadingState,
  addButtonFeedback,
  removeButtonFeedback,
  debounce,
  type CompletionAnimationOptions,
  type FeedbackAnimationOptions,
  type StateTransitionOptions,
} from '../lib/animations';

export interface UseAnimationsReturn {
  // Completion animations
  triggerCompletion: (element: HTMLElement, options?: CompletionAnimationOptions) => Promise<void>;
  
  // User feedback
  showSuccess: (message: string, duration?: number) => Promise<void>;
  showError: (message: string, duration?: number) => Promise<void>;
  showWarning: (message: string, duration?: number) => Promise<void>;
  showInfo: (message: string, duration?: number) => Promise<void>;
  
  // State transitions
  animateTransition: (element: HTMLElement, options: StateTransitionOptions) => Promise<void>;
  
  // Loading states
  setLoading: (element: HTMLElement, type?: 'spinner' | 'pulse') => void;
  clearLoading: (element: HTMLElement) => void;
  
  // Button feedback
  enhanceButton: (button: HTMLElement) => void;
  removeButtonEnhancement: (button: HTMLElement) => void;
  
  // Utility functions
  debouncedCallback: <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
}

export function useAnimations(): UseAnimationsReturn {
  const activeAnimationsRef = useRef<Set<Promise<void>>>(new Set());
  const enhancedButtonsRef = useRef<Set<HTMLElement>>(new Set());

  // Cleanup function
  const cleanup = useCallback(() => {
    // Remove button enhancements
    enhancedButtonsRef.current.forEach(button => {
      removeButtonFeedback(button);
    });
    enhancedButtonsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Completion animation with tracking
  const triggerCompletion = useCallback(async (
    element: HTMLElement,
    options?: CompletionAnimationOptions
  ): Promise<void> => {
    const animationPromise = triggerCompletionAnimation(element, options);
    activeAnimationsRef.current.add(animationPromise);
    
    try {
      await animationPromise;
    } finally {
      activeAnimationsRef.current.delete(animationPromise);
    }
  }, []);

  // Feedback functions
  const showSuccess = useCallback(async (message: string, duration = 3000): Promise<void> => {
    return showFeedback({
      type: 'success',
      message,
      duration,
      position: 'top',
    });
  }, []);

  const showError = useCallback(async (message: string, duration = 4000): Promise<void> => {
    return showFeedback({
      type: 'error',
      message,
      duration,
      position: 'top',
    });
  }, []);

  const showWarning = useCallback(async (message: string, duration = 3500): Promise<void> => {
    return showFeedback({
      type: 'warning',
      message,
      duration,
      position: 'top',
    });
  }, []);

  const showInfo = useCallback(async (message: string, duration = 3000): Promise<void> => {
    return showFeedback({
      type: 'info',
      message,
      duration,
      position: 'top',
    });
  }, []);

  // State transition animation
  const animateTransition = useCallback(async (
    element: HTMLElement,
    options: StateTransitionOptions
  ): Promise<void> => {
    const animationPromise = animateStateTransition(element, options);
    activeAnimationsRef.current.add(animationPromise);
    
    try {
      await animationPromise;
    } finally {
      activeAnimationsRef.current.delete(animationPromise);
    }
  }, []);

  // Loading state management
  const setLoading = useCallback((element: HTMLElement, type: 'spinner' | 'pulse' = 'spinner'): void => {
    addLoadingState(element, type);
  }, []);

  const clearLoading = useCallback((element: HTMLElement): void => {
    removeLoadingState(element);
  }, []);

  // Button enhancement
  const enhanceButton = useCallback((button: HTMLElement): void => {
    if (!enhancedButtonsRef.current.has(button)) {
      addButtonFeedback(button);
      enhancedButtonsRef.current.add(button);
    }
  }, []);

  const removeButtonEnhancement = useCallback((button: HTMLElement): void => {
    if (enhancedButtonsRef.current.has(button)) {
      removeButtonFeedback(button);
      enhancedButtonsRef.current.delete(button);
    }
  }, []);

  // Debounced callback creator
  const debouncedCallback = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    return debounce(func, wait);
  }, []);

  return {
    triggerCompletion,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    animateTransition,
    setLoading,
    clearLoading,
    enhanceButton,
    removeButtonEnhancement,
    debouncedCallback,
  };
}

export default useAnimations;