// Visual Effects Components
export { default as VisualEffectEngine } from './VisualEffectEngine';
export { default as ParticleEffect } from './ParticleEffect';
export { default as VisualEffectWrapper } from './VisualEffectWrapper';
export { default as VisualEffectsDemo } from './VisualEffectsDemo';

// Re-export types for convenience
export type { FreshnessState, VisualTheme, FreshnessVisualConfig } from '../../types';

// Re-export utility functions
export {
  getFreshnessClassName,
  getTransitionClassName,
  generateCSSVariables,
  generateFilterEffects,
  generateAnimationClasses,
  getVisualTheme,
  getParticleConfig,
  hasParticleEffects,
  getCSSVariablesObject,
} from '../../lib/visualEffects';