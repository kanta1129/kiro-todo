'use client';

import React from 'react';
import type { FreshnessState } from '../../types';
import { VisualEffectEngine } from './VisualEffectEngine';
import { useVisualEffects } from '../../hooks/useVisualEffects';
import { VisualEffectErrorBoundary } from '../ErrorBoundaries';

interface VisualEffectWrapperProps {
  freshnessState: FreshnessState;
  children: React.ReactNode;
  className?: string;
  enableTransitions?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  onStateChange?: (newState: FreshnessState, previousState?: FreshnessState) => void;
}

/**
 * Wrapper component that applies visual effects to any child element
 * Requirements: 1.3, 2.2, 2.3, 3.2
 */
export function VisualEffectWrapper({
  freshnessState,
  children,
  className = '',
  enableTransitions = true,
  isRevealed = false,
  onClick,
  onStateChange,
}: VisualEffectWrapperProps) {
  const {
    currentState,
    previousState,
    isTransitioning,
    updateState,
  } = useVisualEffects(freshnessState, {
    enableTransitions,
    onStateChange,
  });

  const handleClick = () => {
    onClick?.();
  };

  const handleTransitionComplete = () => {
    // Transition completed, can trigger any additional effects here
  };

  return (
    <VisualEffectErrorBoundary>
      <VisualEffectEngine
        freshnessState={currentState}
        previousState={previousState}
        className={className}
        isRevealed={isRevealed}
        onTransitionComplete={handleTransitionComplete}
      >
        <div 
          onClick={handleClick}
          className={onClick ? 'cursor-pointer' : ''}
          data-testid="visual-effect-content"
        >
          {children}
        </div>
      </VisualEffectEngine>
    </VisualEffectErrorBoundary>
  );
}

export default VisualEffectWrapper;