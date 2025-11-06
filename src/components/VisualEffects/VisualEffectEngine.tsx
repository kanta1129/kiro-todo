'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { FreshnessState } from '../../types';
import { 
  getFreshnessClassName, 
  getTransitionClassName, 
  generateFilterEffects,
  getCSSVariablesObject 
} from '../../lib/visualEffects';
import ParticleEffect from './ParticleEffect';

interface VisualEffectEngineProps {
  freshnessState: FreshnessState;
  previousState?: FreshnessState;
  children: React.ReactNode;
  className?: string;
  isRevealed?: boolean; // For tombstone mode
  onTransitionComplete?: () => void;
}

/**
 * VisualEffectEngine component that manages all visual effects for tasks
 * Requirements: 1.3, 2.2, 2.3, 3.2, 5.3
 */
export function VisualEffectEngine({
  freshnessState,
  previousState,
  children,
  className = '',
  isRevealed = false,
  onTransitionComplete,
}: VisualEffectEngineProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentState, setCurrentState] = useState(freshnessState);
  const containerRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle state transitions
  useEffect(() => {
    if (previousState && previousState !== freshnessState) {
      setIsTransitioning(true);
      
      // Clear any existing transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      // Set transition timeout based on animation duration
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentState(freshnessState);
        setIsTransitioning(false);
        onTransitionComplete?.();
      }, 800); // Match CSS transition duration
    } else {
      setCurrentState(freshnessState);
    }

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [freshnessState, previousState, onTransitionComplete]);

  // Generate CSS classes
  const baseClassName = getFreshnessClassName(currentState);
  const transitionClassName = isTransitioning && previousState 
    ? getTransitionClassName(previousState, freshnessState)
    : '';
  
  const revealedClassName = freshnessState === '期限切れ' && isRevealed ? 'revealed' : '';
  
  const combinedClassName = [
    baseClassName,
    transitionClassName,
    revealedClassName,
    'state-transition',
    className,
  ].filter(Boolean).join(' ');

  // Generate inline styles for CSS variables
  const cssVariables = getCSSVariablesObject(currentState);
  const filterEffects = generateFilterEffects(currentState);

  const containerStyle: React.CSSProperties = {
    ...cssVariables,
    filter: filterEffects,
  };

  return (
    <div
      ref={containerRef}
      className={combinedClassName}
      style={containerStyle}
      data-freshness-state={currentState}
      data-transitioning={isTransitioning}
      data-revealed={isRevealed}
    >
      {children}
      
      {/* Particle effects for supported states */}
      <ParticleEffect
        freshnessState={currentState}
        isActive={!isTransitioning}
      />
    </div>
  );
}

export default VisualEffectEngine;