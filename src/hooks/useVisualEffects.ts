'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FreshnessState } from '../types';
import { getFreshnessTransition } from '../lib/freshness';

interface UseVisualEffectsOptions {
  enableTransitions?: boolean;
  transitionDuration?: number;
  onStateChange?: (newState: FreshnessState, previousState?: FreshnessState) => void;
}

interface UseVisualEffectsReturn {
  currentState: FreshnessState;
  previousState: FreshnessState | undefined;
  isTransitioning: boolean;
  transitionDirection: 'improving' | 'degrading' | 'stable';
  updateState: (newState: FreshnessState) => void;
  forceUpdate: () => void;
}

/**
 * Hook for managing visual effects state and transitions
 * Requirements: 2.2, 2.3, 5.3
 */
export function useVisualEffects(
  initialState: FreshnessState,
  options: UseVisualEffectsOptions = {}
): UseVisualEffectsReturn {
  const {
    enableTransitions = true,
    transitionDuration = 800,
    onStateChange,
  } = options;

  const [currentState, setCurrentState] = useState<FreshnessState>(initialState);
  const [previousState, setPreviousState] = useState<FreshnessState | undefined>();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate transition direction
  const transitionDirection = previousState 
    ? getFreshnessTransition(previousState, currentState)
    : 'stable';

  const updateState = useCallback((newState: FreshnessState) => {
    if (newState === currentState) {
      return; // No change needed
    }

    const oldState = currentState;
    
    if (enableTransitions) {
      setIsTransitioning(true);
      setPreviousState(oldState);
      
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      // Set new state after transition delay
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentState(newState);
        setIsTransitioning(false);
        onStateChange?.(newState, oldState);
      }, transitionDuration);
    } else {
      setCurrentState(newState);
      setPreviousState(oldState);
      onStateChange?.(newState, oldState);
    }
  }, [currentState, enableTransitions, transitionDuration, onStateChange]);

  const forceUpdate = useCallback(() => {
    // Force a re-render by updating the state to itself
    setCurrentState(prev => prev);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Update state when initialState changes
  useEffect(() => {
    if (initialState !== currentState) {
      updateState(initialState);
    }
  }, [initialState, currentState, updateState]);

  return {
    currentState,
    previousState,
    isTransitioning,
    transitionDirection,
    updateState,
    forceUpdate,
  };
}

export default useVisualEffects;