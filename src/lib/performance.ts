/**
 * Performance optimization utilities
 * Requirements: 2.4, 5.3
 */

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility for expensive calculations
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

// Request Animation Frame utility for smooth animations
export function requestAnimationFramePromise(): Promise<number> {
  return new Promise(resolve => {
    requestAnimationFrame(resolve);
  });
}

// Batch DOM updates for better performance
export function batchDOMUpdates(updates: (() => void)[]): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
      resolve();
    });
  });
}

// Performance measurement utility
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  
  start(label: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  }
  
  end(label: string): number {
    if (typeof performance === 'undefined') return 0;
    
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label, 'measure')[0];
    const duration = measure?.duration || 0;
    
    // Store measurement
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
    
    // Clean up marks and measures
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
    
    return duration;
  }
  
  getAverageTime(label: string): number {
    const times = this.measurements.get(label) || [];
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  getStats(label: string): { avg: number; min: number; max: number; count: number } {
    const times = this.measurements.get(label) || [];
    if (times.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    return {
      avg: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length,
    };
  }
  
  clear(label?: string): void {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Bundle size optimization utilities
export function lazyImport<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): () => Promise<T> {
  let cached: T | null = null;
  
  return async () => {
    if (cached) return cached;
    
    try {
      const module = await importFn();
      cached = module.default;
      return cached;
    } catch (error) {
      console.error('Failed to lazy import:', error);
      if (fallback) return fallback;
      throw error;
    }
  };
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if (typeof performance === 'undefined' || !('memory' in performance)) {
    return null;
  }
  
  const memory = (performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
  };
}

// Intersection Observer utility for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Virtual scrolling utility for large lists
export function calculateVisibleItems(
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
  overscan: number = 5
): { startIndex: number; endIndex: number; visibleItems: number } {
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);
  
  return { startIndex, endIndex, visibleItems };
}

// CSS-in-JS optimization
export function createOptimizedStyles(styles: Record<string, any>): string {
  return Object.entries(styles)
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ');
}

// Animation frame scheduler for smooth updates
export class AnimationScheduler {
  private queue: (() => void)[] = [];
  private isRunning = false;
  
  schedule(callback: () => void): void {
    this.queue.push(callback);
    
    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  private flush(): void {
    const callbacks = [...this.queue];
    this.queue.length = 0;
    
    callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Animation callback error:', error);
      }
    });
    
    this.isRunning = false;
    
    // Continue if more callbacks were added during execution
    if (this.queue.length > 0) {
      requestAnimationFrame(() => this.flush());
      this.isRunning = true;
    }
  }
}

export const animationScheduler = new AnimationScheduler();

// Web Worker utility for heavy computations
export function createWorkerFromFunction(fn: Function): Worker | null {
  if (typeof Worker === 'undefined') {
    return null;
  }
  
  const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  
  try {
    return new Worker(url);
  } catch (error) {
    console.error('Failed to create worker:', error);
    URL.revokeObjectURL(url);
    return null;
  }
}

// Performance-optimized event listener
export function addOptimizedEventListener(
  element: Element | Window | Document,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): () => void {
  const optimizedHandler = throttle(handler, 16); // 60fps
  
  element.addEventListener(event, optimizedHandler, {
    passive: true,
    ...options,
  });
  
  return () => {
    element.removeEventListener(event, optimizedHandler);
  };
}