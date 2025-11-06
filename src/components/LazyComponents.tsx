'use client';

import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';

// Lazy load heavy components for better performance
export const LazyTaskForm = lazy(() => import('./TaskForm/TaskForm'));
export const LazyRealTimeMetrics = lazy(() => import('./RealTimeMetrics/RealTimeMetrics'));
export const LazyVisualEffectsDemo = lazy(() => import('./VisualEffects/VisualEffectsDemo'));

// Loading fallback components
const FormLoadingFallback = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const MetricsLoadingFallback = () => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="grid grid-cols-2 gap-2">
      <div className="h-8 bg-gray-200 rounded"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const DemoLoadingFallback = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-4"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Wrapper components with Suspense
export const TaskFormWithSuspense = (props: any) => (
  <Suspense fallback={<FormLoadingFallback />}>
    <LazyTaskForm {...props} />
  </Suspense>
);

export const RealTimeMetricsWithSuspense = (props: any) => (
  <Suspense fallback={<MetricsLoadingFallback />}>
    <LazyRealTimeMetrics {...props} />
  </Suspense>
);

export const VisualEffectsDemoWithSuspense = (props: any) => (
  <Suspense fallback={<DemoLoadingFallback />}>
    <LazyVisualEffectsDemo {...props} />
  </Suspense>
);

// Performance monitoring wrapper
export function withPerformanceMonitoring<T extends object>(
  Component: ComponentType<T>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: T) {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      // Use useEffect to measure render time
      import('react').then(({ useEffect }) => {
        useEffect(() => {
          const endTime = performance.now();
          const renderTime = endTime - startTime;
          
          if (renderTime > 16) { // More than one frame (16ms)
            console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`);
          }
        });
      });
    }
    
    return <Component {...props} />;
  };
}

// Memoized component factory
export function createMemoizedComponent<T extends object>(
  Component: ComponentType<T>,
  areEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return import('react').then(({ memo }) => memo(Component, areEqual));
}