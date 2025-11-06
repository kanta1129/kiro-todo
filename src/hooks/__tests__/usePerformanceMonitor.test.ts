import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useRenderPerformance, 
  useOperationPerformance, 
  useMemoryMonitor,
  usePerformanceBenchmark 
} from '../usePerformanceMonitor';

// Mock performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => [{ duration: 10, entryType: 'measure', name: 'test', startTime: 0, toJSON: vi.fn() }]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('useRenderPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track render count', async () => {
    const { result, rerender } = renderHook(() => useRenderPerformance('TestComponent'));

    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.renderCount).toBe(1);

    rerender();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current.renderCount).toBe(2);

    rerender();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current.renderCount).toBe(3);
  });

  it('should measure render performance', async () => {
    const { result } = renderHook(() => useRenderPerformance('TestComponent'));

    // Fast-forward timers to trigger performance measurement
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockPerformance.mark).toHaveBeenCalledWith('TestComponent-render-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('TestComponent-render-end');
  });

  it('should clear stats', () => {
    const { result } = renderHook(() => useRenderPerformance('TestComponent'));

    act(() => {
      result.current.clearStats();
    });

    expect(result.current.renderCount).toBe(0);
    expect(result.current.renderStats.count).toBe(0);
  });
});

describe('useOperationPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should measure operation performance', async () => {
    const { result } = renderHook(() => useOperationPerformance());

    const testOperation = vi.fn(() => 'result');

    await act(async () => {
      const operationResult = await result.current.measureOperation('testOp', testOperation);
      expect(operationResult).toBe('result');
    });

    expect(testOperation).toHaveBeenCalled();
    expect(mockPerformance.mark).toHaveBeenCalledWith('testOp-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('testOp-end');
  });

  it('should handle async operations', async () => {
    const { result } = renderHook(() => useOperationPerformance());

    const asyncOperation = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'async result';
    });

    await act(async () => {
      const operationResult = await result.current.measureOperation('asyncOp', asyncOperation);
      expect(operationResult).toBe('async result');
    });

    expect(asyncOperation).toHaveBeenCalled();
  });

  it('should handle operation errors', async () => {
    const { result } = renderHook(() => useOperationPerformance());

    const errorOperation = vi.fn(() => {
      throw new Error('Test error');
    });

    await act(async () => {
      await expect(
        result.current.measureOperation('errorOp', errorOperation)
      ).rejects.toThrow('Test error');
    });

    expect(mockPerformance.mark).toHaveBeenCalledWith('errorOp-end');
  });

  it('should clear operation stats', () => {
    const { result } = renderHook(() => useOperationPerformance());

    act(() => {
      result.current.clearOperationStats('testOp');
    });

    expect(result.current.operationStats.testOp).toBeUndefined();
  });
});

describe('useMemoryMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should monitor memory usage', async () => {
    const { result } = renderHook(() => useMemoryMonitor(1000));

    // Wait for initial memory reading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.memoryUsage).toEqual({
      used: 50000000,
      total: 100000000,
      percentage: 50,
    });
  });

  it('should update memory usage periodically', async () => {
    const { result } = renderHook(() => useMemoryMonitor(1000));

    // Wait for initial setup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Change memory values
    mockPerformance.memory.usedJSHeapSize = 60000000;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.memoryUsage?.percentage).toBe(60);
  });

  it('should track memory history', async () => {
    const { result } = renderHook(() => useMemoryMonitor(1000));

    // Wait for initial setup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.memoryHistory.length).toBeGreaterThan(0);
  });

  it('should calculate memory trend', () => {
    const { result } = renderHook(() => useMemoryMonitor(1000));

    // Add some history entries
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const trend = result.current.getMemoryTrend();
    expect(['increasing', 'decreasing', 'stable']).toContain(trend);
  });

  it('should clear memory history', () => {
    const { result } = renderHook(() => useMemoryMonitor(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.clearMemoryHistory();
    });

    expect(result.current.memoryHistory).toHaveLength(0);
  });

  it('should handle missing performance.memory', () => {
    const originalMemory = mockPerformance.memory;
    delete (mockPerformance as any).memory;

    const { result } = renderHook(() => useMemoryMonitor(1000));

    expect(result.current.memoryUsage).toBeNull();

    // Restore memory
    mockPerformance.memory = originalMemory;
  });
});

describe('usePerformanceBenchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now = vi.fn()
      .mockReturnValueOnce(0)   // Start time
      .mockReturnValueOnce(10)  // End time
      .mockReturnValueOnce(0)   // Start time
      .mockReturnValueOnce(15)  // End time
      .mockReturnValueOnce(0)   // Start time
      .mockReturnValueOnce(5);  // End time
  });

  it('should run benchmarks', async () => {
    const { result } = renderHook(() => usePerformanceBenchmark());

    const testOperation = vi.fn();

    await act(async () => {
      const benchmarkResult = await result.current.runBenchmark('testBench', testOperation, 3);
      
      expect(benchmarkResult.iterations).toBe(3);
      expect(benchmarkResult.averageTime).toBe(10); // (10 + 15 + 5) / 3
      expect(benchmarkResult.minTime).toBe(5);
      expect(benchmarkResult.maxTime).toBe(15);
    });

    expect(testOperation).toHaveBeenCalledTimes(13); // 10 warmup + 3 actual
  });

  it('should compare benchmarks', async () => {
    const { result } = renderHook(() => usePerformanceBenchmark());

    const fastOperation = vi.fn();
    const slowOperation = vi.fn();

    // Mock different performance times
    mockPerformance.now = vi.fn()
      .mockReturnValueOnce(0).mockReturnValueOnce(5)   // Fast: 5ms
      .mockReturnValueOnce(0).mockReturnValueOnce(10); // Slow: 10ms

    await act(async () => {
      await result.current.runBenchmark('fast', fastOperation, 1);
      await result.current.runBenchmark('slow', slowOperation, 1);
    });

    const comparison = result.current.compareBenchmarks('fast', 'slow');
    
    expect(comparison).toBeDefined();
    expect(comparison?.winner).toBe('fast');
    expect(comparison?.speedup).toBe(2); // 10ms / 5ms
  });

  it('should export benchmark results', async () => {
    const { result } = renderHook(() => usePerformanceBenchmark());

    // Mock DOM methods
    const mockCreateElement = vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    }));
    const mockCreateObjectURL = vi.fn(() => 'mock-url');
    const mockRevokeObjectURL = vi.fn();

    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
    });
    Object.defineProperty(URL, 'createObjectURL', {
      value: mockCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL,
    });

    const testOperation = vi.fn();

    await act(async () => {
      await result.current.runBenchmark('test', testOperation, 1);
      result.current.exportBenchmarks();
    });

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should handle benchmark errors', async () => {
    const { result } = renderHook(() => usePerformanceBenchmark());

    const errorOperation = vi.fn(() => {
      throw new Error('Benchmark error');
    });

    await expect(
      result.current.runBenchmark('errorBench', errorOperation, 1)
    ).rejects.toThrow('Benchmark error');
  });
});