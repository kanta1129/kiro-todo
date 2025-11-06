/**
 * Performance monitoring hooks
 * Requirements: 2.4
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { performanceMonitor } from '../lib/performance';

export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  } | null;
  componentCount: number;
  reRenderCount: number;
}

export interface PerformanceStats {
  avg: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const [renderStats, setRenderStats] = useState<PerformanceStats>({
    avg: 0,
    min: 0,
    max: 0,
    count: 0,
  });

  useEffect(() => {
    renderCountRef.current += 1;
    const renderLabel = `${componentName}-render`;
    
    performanceMonitor.start(renderLabel);
    
    // Measure after render is complete
    const timeoutId = setTimeout(() => {
      const duration = performanceMonitor.end(renderLabel);
      const stats = performanceMonitor.getStats(renderLabel);
      setRenderStats(stats);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  });

  const getRenderCount = useCallback(() => renderCountRef.current, []);
  
  const clearStats = useCallback(() => {
    performanceMonitor.clear(`${componentName}-render`);
    renderCountRef.current = 0;
    setRenderStats({ avg: 0, min: 0, max: 0, count: 0 });
  }, [componentName]);

  return {
    renderCount: renderCountRef.current,
    renderStats,
    getRenderCount,
    clearStats,
  };
}

/**
 * Hook for measuring operation performance
 */
export function useOperationPerformance() {
  const [operationStats, setOperationStats] = useState<Record<string, PerformanceStats>>({});

  const measureOperation = useCallback(async <T>(
    operationName: string,
    operation: () => T | Promise<T>
  ): Promise<T> => {
    performanceMonitor.start(operationName);
    
    try {
      const result = await operation();
      const duration = performanceMonitor.end(operationName);
      const stats = performanceMonitor.getStats(operationName);
      
      setOperationStats(prev => ({
        ...prev,
        [operationName]: stats,
      }));
      
      return result;
    } catch (error) {
      performanceMonitor.end(operationName);
      throw error;
    }
  }, []);

  const getOperationStats = useCallback((operationName: string) => {
    return operationStats[operationName] || { avg: 0, min: 0, max: 0, count: 0 };
  }, [operationStats]);

  const clearOperationStats = useCallback((operationName?: string) => {
    if (operationName) {
      performanceMonitor.clear(operationName);
      setOperationStats(prev => {
        const { [operationName]: _, ...rest } = prev;
        return rest;
      });
    } else {
      performanceMonitor.clear();
      setOperationStats({});
    }
  }, []);

  return {
    measureOperation,
    operationStats,
    getOperationStats,
    clearOperationStats,
  };
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitor(intervalMs: number = 5000) {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);
  
  const [memoryHistory, setMemoryHistory] = useState<Array<{
    timestamp: number;
    used: number;
    total: number;
    percentage: number;
  }>>([]);

  useEffect(() => {
    const updateMemoryUsage = () => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        const usage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
        };
        
        setMemoryUsage(usage);
        setMemoryHistory(prev => {
          const newHistory = [...prev, { ...usage, timestamp: Date.now() }];
          // Keep only last 100 entries
          return newHistory.slice(-100);
        });
      }
    };

    updateMemoryUsage();
    const intervalId = setInterval(updateMemoryUsage, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  const getMemoryTrend = useCallback(() => {
    if (memoryHistory.length < 2) return 'stable';
    
    const recent = memoryHistory.slice(-5);
    const trend = recent[recent.length - 1].percentage - recent[0].percentage;
    
    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }, [memoryHistory]);

  const clearMemoryHistory = useCallback(() => {
    setMemoryHistory([]);
  }, []);

  return {
    memoryUsage,
    memoryHistory,
    getMemoryTrend,
    clearMemoryHistory,
  };
}

/**
 * Hook for comprehensive performance monitoring
 */
export function usePerformanceMetrics(componentName: string) {
  const renderPerf = useRenderPerformance(componentName);
  const operationPerf = useOperationPerformance();
  const memoryMonitor = useMemoryMonitor();
  
  const [fps, setFps] = useState(0);
  const fpsRef = useRef<{
    frames: number;
    lastTime: number;
  }>({ frames: 0, lastTime: performance.now() });

  // FPS monitoring
  useEffect(() => {
    let animationId: number;
    
    const measureFps = () => {
      const now = performance.now();
      fpsRef.current.frames++;
      
      if (now - fpsRef.current.lastTime >= 1000) {
        setFps(Math.round((fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime)));
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }
      
      animationId = requestAnimationFrame(measureFps);
    };
    
    animationId = requestAnimationFrame(measureFps);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const getMetrics = useCallback((): PerformanceMetrics => ({
    renderTime: renderPerf.renderStats.avg,
    updateTime: operationPerf.operationStats.update?.avg || 0,
    memoryUsage: memoryMonitor.memoryUsage,
    componentCount: 1, // This component
    reRenderCount: renderPerf.renderCount,
  }), [renderPerf, operationPerf, memoryMonitor]);

  const exportMetrics = useCallback(() => {
    const metrics = {
      component: componentName,
      timestamp: new Date().toISOString(),
      render: renderPerf.renderStats,
      operations: operationPerf.operationStats,
      memory: {
        current: memoryMonitor.memoryUsage,
        history: memoryMonitor.memoryHistory,
        trend: memoryMonitor.getMemoryTrend(),
      },
      fps,
      renderCount: renderPerf.renderCount,
    };
    
    // Export as JSON for analysis
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${componentName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return metrics;
  }, [componentName, renderPerf, operationPerf, memoryMonitor, fps]);

  return {
    ...renderPerf,
    ...operationPerf,
    ...memoryMonitor,
    fps,
    getMetrics,
    exportMetrics,
  };
}

/**
 * Hook for performance benchmarking
 */
export function usePerformanceBenchmark() {
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, {
    iterations: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    opsPerSecond: number;
  }>>({});

  const runBenchmark = useCallback(async (
    name: string,
    operation: () => void | Promise<void>,
    iterations: number = 1000
  ) => {
    const times: number[] = [];
    
    // Warm up
    for (let i = 0; i < 10; i++) {
      await operation();
    }
    
    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await operation();
      const end = performance.now();
      times.push(end - start);
    }
    
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / averageTime;
    
    const result = {
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      opsPerSecond,
    };
    
    setBenchmarkResults(prev => ({
      ...prev,
      [name]: result,
    }));
    
    return result;
  }, []);

  const compareBenchmarks = useCallback((name1: string, name2: string) => {
    const bench1 = benchmarkResults[name1];
    const bench2 = benchmarkResults[name2];
    
    if (!bench1 || !bench2) {
      return null;
    }
    
    const speedup = bench2.averageTime / bench1.averageTime;
    const winner = speedup > 1 ? name1 : name2;
    
    return {
      speedup: Math.abs(speedup),
      winner,
      difference: `${Math.abs((speedup - 1) * 100).toFixed(1)}%`,
    };
  }, [benchmarkResults]);

  const exportBenchmarks = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      results: benchmarkResults,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-benchmarks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return data;
  }, [benchmarkResults]);

  return {
    benchmarkResults,
    runBenchmark,
    compareBenchmarks,
    exportBenchmarks,
  };
}