import type { FreshnessState, VisualTheme, FreshnessVisualConfig } from '../types';

/**
 * Visual effect configuration for each freshness state
 * Requirements: 1.3, 2.2, 2.3, 3.2
 */
export const FRESHNESS_VISUAL_CONFIG: FreshnessVisualConfig = {
  '新規': {
    colors: [
      '--task-bg: var(--fresh-50)',
      '--task-border: var(--fresh-500)',
      '--task-text: var(--fresh-600)',
      '--task-glow: rgba(34, 197, 94, 0.3)',
    ],
    effects: [
      'brightness(1.1)',
      'saturate(1.2)',
      'drop-shadow(0 0 8px var(--task-glow))',
    ],
    animations: [
      'glow 3s ease-in-out infinite alternate',
      'pulse-gentle 4s ease-in-out infinite',
    ],
  },
  '期限接近': {
    colors: [
      '--task-bg: var(--approaching-50)',
      '--task-border: var(--approaching-500)',
      '--task-text: var(--approaching-600)',
      '--task-warning: rgba(245, 158, 11, 0.4)',
    ],
    effects: [
      'saturate(0.8)',
      'sepia(0.1)',
      'hue-rotate(10deg)',
    ],
    animations: [
      'fade-warning 2s ease-in-out infinite alternate',
    ],
  },
  '期限間近': {
    colors: [
      '--task-bg: var(--urgent-50)',
      '--task-border: var(--urgent-500)',
      '--task-text: var(--urgent-600)',
      '--task-decay: rgba(139, 69, 19, 0.3)',
      '--task-mold: rgba(0, 100, 0, 0.2)',
    ],
    effects: [
      'saturate(0.6)',
      'sepia(0.3)',
      'hue-rotate(30deg)',
      'brightness(0.9)',
    ],
    animations: [
      'decay-rot 4s ease-in-out infinite',
      'mold-growth 6s ease-in-out infinite alternate',
    ],
  },
  '期限切れ': {
    colors: [
      '--task-bg: var(--expired-900)',
      '--task-border: var(--expired-600)',
      '--task-text: var(--expired-100)',
      '--task-tombstone: rgba(17, 24, 39, 0.95)',
      '--task-reveal: rgba(55, 65, 81, 0.8)',
    ],
    effects: [
      'saturate(0.3)',
      'brightness(0.4)',
      'contrast(0.8)',
    ],
    animations: [
      'tombstone-pulse 3s ease-in-out infinite',
    ],
  },
};

/**
 * Generate CSS custom properties for a freshness state
 */
export function generateCSSVariables(state: FreshnessState): string {
  const config = FRESHNESS_VISUAL_CONFIG[state];
  return config.colors.join('; ') + ';';
}

/**
 * Generate CSS filter effects for a freshness state
 */
export function generateFilterEffects(state: FreshnessState): string {
  const config = FRESHNESS_VISUAL_CONFIG[state];
  return config.effects.join(' ');
}

/**
 * Generate CSS animation classes for a freshness state
 */
export function generateAnimationClasses(state: FreshnessState): string[] {
  const config = FRESHNESS_VISUAL_CONFIG[state];
  return config.animations;
}

/**
 * Get complete visual theme for a freshness state
 */
export function getVisualTheme(state: FreshnessState): VisualTheme {
  return FRESHNESS_VISUAL_CONFIG[state];
}

/**
 * Generate particle effect configuration
 */
export interface ParticleConfig {
  count: number;
  size: string;
  color: string;
  animation: string;
  duration: string;
}

export function getParticleConfig(state: FreshnessState): ParticleConfig | null {
  switch (state) {
    case '新規':
      return {
        count: 3,
        size: '2px',
        color: 'rgba(34, 197, 94, 0.6)',
        animation: 'sparkle',
        duration: '2s',
      };
    case '期限間近':
      return {
        count: 5,
        size: '3px',
        color: 'rgba(0, 100, 0, 0.4)',
        animation: 'mold-spore',
        duration: '4s',
      };
    case '期限切れ':
      return {
        count: 2,
        size: '1px',
        color: 'rgba(75, 85, 99, 0.3)',
        animation: 'dust',
        duration: '6s',
      };
    default:
      return null;
  }
}

/**
 * CSS class name generator for freshness states
 */
export function getFreshnessClassName(state: FreshnessState): string {
  return `freshness-${state}`;
}

/**
 * Generate transition class for state changes
 */
export function getTransitionClassName(
  fromState: FreshnessState,
  toState: FreshnessState
): string {
  return `transition-${fromState}-to-${toState}`;
}

/**
 * Check if state supports particle effects
 */
export function hasParticleEffects(state: FreshnessState): boolean {
  return ['新規', '期限間近', '期限切れ'].includes(state);
}

/**
 * Get CSS variables as an object for React inline styles
 */
export function getCSSVariablesObject(state: FreshnessState): Record<string, string> {
  const config = FRESHNESS_VISUAL_CONFIG[state];
  const variables: Record<string, string> = {};
  
  config.colors.forEach(colorDef => {
    const [property, value] = colorDef.split(': ');
    if (property && value) {
      variables[property] = value;
    }
  });
  
  return variables;
}