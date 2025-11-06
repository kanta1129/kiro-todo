// Error boundary components and utilities
export { TaskErrorBoundary, TaskErrorFallback } from './TaskErrorBoundary';
export { 
  VisualEffectErrorBoundary, 
  VisualEffectErrorFallback,
  SafeVisualEffectWrapper 
} from './VisualEffectErrorBoundary';
export { 
  ErrorFallbackUI, 
  InlineErrorDisplay, 
  LoadingWithError 
} from './ErrorFallbackUI';

// Re-export types
export type { ErrorBoundaryProps, ErrorFallbackProps } from '../../types';