import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  debounce, 
  throttle, 
  memoize, 
  performanceMonitor,
  PerformanceMonitor,
  getMemoryUsage,
  calculateVisibleItems
} from '../performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should limit function calls', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const expensiveFn = vi.fn((x: number) => x * 2);
      const memoizedFn = memoize(expensiveFn);

      const result1 = memoizedFn(5);
      const result2 = memoizedFn(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom key generator', () => {
      const fn = vi.fn((obj: { id: number; name: string }) => obj.id + obj.name.length);
      const memoizedFn = memoize(fn, (obj) => `${obj.id}-${obj.name}`);

      const obj1 = { id: 1, name: 'test' };
      const obj2 = { id: 1, name: 'test' };

      memoizedFn(obj1);
      memoizedFn(obj2);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should limit cache size', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoizedFn = memoize(fn);

      // Fill cache beyond limit
      for (let i = 0; i < 105; i++) {
        memoizedFn(i);
      }

      // First call should be evicted from cache
      memoizedFn(0);
      expect(fn).toHaveBeenCalledTimes(106); // 105 + 1 (re-call of 0)
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
      // Mock performance API
      global.performance = {
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByName: vi.fn(() => [{ duration: 100 }]),
        clearMarks: vi.fn(),
        clearMeasures: vi.fn(),
      } as any;
    });

    it('should measure performance', () => {
      monitor.start('test');
      const duration = monitor.end('test');

      expect(duration).toBe(100);
      expect(global.performance.mark).toHaveBeenCalledWith('test-start');
      expect(global.performance.mark).toHaveBeenCalledWith('test-end');
    });

    it('should calculate average time', () => {
      // Mock multiple measurements
      global.performance.getEntriesByName = vi.fn(() => [{ duration: 50 }]);
      
      monitor.start('test');
      monitor.end('test');
      
      global.performance.getEntriesByName = vi.fn(() => [{ duration: 150 }]);
      monitor.start('test');
      monitor.end('test');

      const avg = monitor.getAverageTime('test');
      expect(avg).toBe(100); // (50 + 150) / 2
    });

    it('should provide statistics', () => {
      // Mock measurements
      global.performance.getEntriesByName = vi.fn()
        .mockReturnValueOnce([{ duration: 50 }])
        .mockReturnValueOnce([{ duration: 100 }])
        .mockReturnValueOnce([{ duration: 150 }]);

      monitor.start('test');
      monitor.end('test');
      monitor.start('test');
      monitor.end('test');
      monitor.start('test');
      monitor.end('test');

      const stats = monitor.getStats('test');
      expect(stats.count).toBe(3);
      expect(stats.min).toBe(50);
      expect(stats.max).toBe(150);
      expect(stats.avg).toBe(100);
    });
  });

  describe('calculateVisibleItems', () => {
    it('should calculate visible items correctly', () => {
      const result = calculateVisibleItems(400, 50, 100, 1000, 2);

      expect(result.visibleItems).toBe(8); // 400 / 50
      expect(result.startIndex).toBe(0); // max(0, floor(100/50) - 2)
      expect(result.endIndex).toBe(12); // min(999, 0 + 8 + 4)
    });

    it('should handle edge cases', () => {
      const result = calculateVisibleItems(100, 20, 0, 5, 1);

      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(4); // min(4, calculated end)
    });
  });

  describe('getMemoryUsage', () => {
    it('should return null when performance.memory is not available', () => {
      global.performance = {} as any;
      const usage = getMemoryUsage();
      expect(usage).toBeNull();
    });

    it('should return memory usage when available', () => {
      global.performance = {
        memory: {
          usedJSHeapSize: 50000000,
          totalJSHeapSize: 100000000,
        }
      } as any;

      const usage = getMemoryUsage();
      expect(usage).toEqual({
        used: 50000000,
        total: 100000000,
        percentage: 50,
      });
    });
  });
});