import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  benchmarkFreshnessCalculation,
  benchmarkTaskStoreOperations,
  benchmarkLargeDataset,
  benchmarkComponentRendering,
  runPerformanceBenchmarkSuite,
  generateBenchmarkReport,
  exportBenchmarkResults,
  compareBenchmarkResults,
} from '../performanceBenchmarks';

// Mock performance API
const mockPerformance = {
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

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    className: '',
    innerHTML: '',
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  })),
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
});

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock consistent timing for predictable tests
    let callCount = 0;
    mockPerformance.now.mockImplementation(() => {
      callCount++;
      return callCount * 10; // Each call adds 10ms
    });
  });

  describe('benchmarkFreshnessCalculation', () => {
    it('should benchmark freshness calculation', async () => {
      const result = await benchmarkFreshnessCalculation();
      
      expect(result.name).toBe('Freshness Calculation');
      expect(result.iterations).toBe(1000);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.averageTime).toBeGreaterThan(0);
      expect(result.opsPerSecond).toBeGreaterThan(0);
      expect(result.memoryUsage).toBeDefined();
    });

    it('should provide consistent results', async () => {
      const result1 = await benchmarkFreshnessCalculation();
      const result2 = await benchmarkFreshnessCalculation();
      
      // Results should be similar (within reasonable variance)
      expect(Math.abs(result1.averageTime - result2.averageTime)).toBeLessThan(result1.averageTime * 0.5);
    });
  });

  describe('benchmarkTaskStoreOperations', () => {
    it('should benchmark all task store operations', async () => {
      const results = await benchmarkTaskStoreOperations();
      
      expect(results).toHaveLength(3);
      
      const operationNames = results.map(r => r.name);
      expect(operationNames).toContain('Task Creation');
      expect(operationNames).toContain('Task Update');
      expect(operationNames).toContain('Freshness State Update');
      
      results.forEach(result => {
        expect(result.iterations).toBeGreaterThan(0);
        expect(result.averageTime).toBeGreaterThan(0);
        expect(result.opsPerSecond).toBeGreaterThan(0);
      });
    });

    it('should have reasonable performance metrics', async () => {
      const results = await benchmarkTaskStoreOperations();
      
      results.forEach(result => {
        // Operations should complete in reasonable time (< 100ms average)
        expect(result.averageTime).toBeLessThan(100);
        // Should handle at least 10 operations per second
        expect(result.opsPerSecond).toBeGreaterThan(10);
      });
    });
  });

  describe('benchmarkLargeDataset', () => {
    it('should benchmark different dataset sizes', async () => {
      const results = await benchmarkLargeDataset();
      
      expect(results.length).toBeGreaterThan(0);
      
      // Should test multiple dataset sizes
      const sizeTests = results.filter(r => r.name.includes('Batch Processing'));
      expect(sizeTests.length).toBeGreaterThan(1);
      
      // Larger datasets should generally take longer per iteration
      const small = results.find(r => r.name.includes('100 tasks'));
      const large = results.find(r => r.name.includes('5000 tasks'));
      
      if (small && large) {
        expect(large.averageTime).toBeGreaterThan(small.averageTime);
      }
    });

    it('should scale appropriately with dataset size', async () => {
      const results = await benchmarkLargeDataset();
      
      results.forEach(result => {
        // Even large datasets should complete in reasonable time
        expect(result.averageTime).toBeLessThan(10000); // 10 seconds max
        expect(result.opsPerSecond).toBeGreaterThan(0.1); // At least 0.1 ops/sec
      });
    });
  });

  describe('benchmarkComponentRendering', () => {
    it('should benchmark DOM operations', async () => {
      const results = await benchmarkComponentRendering();
      
      expect(results.length).toBeGreaterThan(0);
      
      const operationNames = results.map(r => r.name);
      expect(operationNames).toContain('DOM Operations');
      expect(operationNames).toContain('CSS Class Updates');
      
      results.forEach(result => {
        expect(result.iterations).toBeGreaterThan(0);
        expect(result.averageTime).toBeGreaterThan(0);
      });
    });

    it('should have fast DOM operations', async () => {
      const results = await benchmarkComponentRendering();
      
      results.forEach(result => {
        // DOM operations should be fast (< 10ms average)
        expect(result.averageTime).toBeLessThan(10);
        // Should handle many operations per second
        expect(result.opsPerSecond).toBeGreaterThan(100);
      });
    });
  });

  describe('runPerformanceBenchmarkSuite', () => {
    it('should run complete benchmark suite', async () => {
      const suite = await runPerformanceBenchmarkSuite();
      
      expect(suite.name).toBe('Task Freshness TODO Performance Suite');
      expect(suite.results.length).toBeGreaterThan(0);
      expect(suite.summary).toBeDefined();
      expect(suite.summary.totalTime).toBeGreaterThan(0);
      expect(suite.summary.averageOpsPerSecond).toBeGreaterThan(0);
    });

    it('should include all benchmark categories', async () => {
      const suite = await runPerformanceBenchmarkSuite();
      
      const resultNames = suite.results.map(r => r.name);
      
      // Should include freshness calculation
      expect(resultNames.some(name => name.includes('Freshness'))).toBe(true);
      
      // Should include task store operations
      expect(resultNames.some(name => name.includes('Task'))).toBe(true);
      
      // Should include batch processing
      expect(resultNames.some(name => name.includes('Batch'))).toBe(true);
      
      // Should include DOM operations
      expect(resultNames.some(name => name.includes('DOM'))).toBe(true);
    });

    it('should calculate summary correctly', async () => {
      const suite = await runPerformanceBenchmarkSuite();
      
      const expectedTotalTime = suite.results.reduce((sum, result) => sum + result.totalTime, 0);
      const expectedAvgOps = suite.results.reduce((sum, result) => sum + result.opsPerSecond, 0) / suite.results.length;
      
      expect(suite.summary.totalTime).toBeCloseTo(expectedTotalTime, 1);
      expect(suite.summary.averageOpsPerSecond).toBeCloseTo(expectedAvgOps, 1);
    });
  });

  describe('generateBenchmarkReport', () => {
    it('should generate comprehensive report', async () => {
      const suite = await runPerformanceBenchmarkSuite();
      const report = generateBenchmarkReport(suite);
      
      expect(report).toContain('# Task Freshness TODO Performance Suite - Benchmark Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Detailed Results');
      expect(report).toContain('## Performance Grades');
      expect(report).toContain('## Recommendations');
    });

    it('should include performance grades', async () => {
      const suite = await runPerformanceBenchmarkSuite();
      const report = generateBenchmarkReport(suite);
      
      expect(report).toContain('Grade A');
      expect(report).toMatch(/Grade [A-D]/);
    });

    it('should provide recommendations for slow operations', async () => {
      const suite = await runPerformanceBenchmarkSuite();
      
      // Artificially make one operation slow
      suite.results[0].averageTime = 15; // > 10ms threshold
      
      const report = generateBenchmarkReport(suite);
      
      expect(report).toContain('### Performance Improvements');
      expect(report).toContain('Optimize');
    });

    it('should identify memory-intensive operations', async () => {
      const suite = await runPerformanceBenchmarkSuite();
      
      // Artificially make one operation memory-intensive
      if (suite.results[0].memoryUsage) {
        suite.results[0].memoryUsage.after = suite.results[0].memoryUsage.before + 2000000; // +2MB
      }
      
      const report = generateBenchmarkReport(suite);
      
      expect(report).toContain('### Memory Optimizations');
      expect(report).toContain('Reduce memory usage');
    });
  });

  describe('exportBenchmarkResults', () => {
    it('should export benchmark results', async () => {
      const suite = await runPerformanceBenchmarkSuite();
      
      // Mock DOM methods for export
      const mockClick = vi.fn();
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick,
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
      
      exportBenchmarkResults(suite);
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('compareBenchmarkResults', () => {
    it('should compare benchmark results', async () => {
      const suite1 = await runPerformanceBenchmarkSuite();
      const suite2 = await runPerformanceBenchmarkSuite();
      
      // Modify suite2 to simulate changes
      suite2.results[0].averageTime = suite1.results[0].averageTime * 0.8; // 20% improvement
      suite2.results[1].averageTime = suite1.results[1].averageTime * 1.2; // 20% regression
      
      const comparison = compareBenchmarkResults(suite2, suite1);
      
      expect(comparison.improvements.length).toBeGreaterThan(0);
      expect(comparison.regressions.length).toBeGreaterThan(0);
      expect(comparison.summary).toBeDefined();
    });

    it('should identify improvements and regressions', async () => {
      const suite1 = await runPerformanceBenchmarkSuite();
      const suite2 = { ...suite1 };
      
      // Create significant improvement (>5%)
      suite2.results = suite1.results.map(result => ({
        ...result,
        averageTime: result.averageTime * 0.9, // 10% faster
        opsPerSecond: result.opsPerSecond * 1.1, // 10% more ops
      }));
      
      const comparison = compareBenchmarkResults(suite2, suite1);
      
      expect(comparison.improvements.length).toBeGreaterThan(0);
      expect(comparison.improvements[0]).toContain('faster');
    });

    it('should calculate summary changes', async () => {
      const suite1 = await runPerformanceBenchmarkSuite();
      const suite2 = { ...suite1 };
      
      suite2.summary = {
        totalTime: suite1.summary.totalTime * 0.8,
        averageOpsPerSecond: suite1.summary.averageOpsPerSecond * 1.2,
        memoryEfficiency: suite1.summary.memoryEfficiency * 0.9,
      };
      
      const comparison = compareBenchmarkResults(suite2, suite1);
      
      expect(comparison.summary.totalTimeChange).toBeCloseTo(-20, 1); // 20% improvement
      expect(comparison.summary.opsPerSecondChange).toBeCloseTo(20, 1); // 20% improvement
      expect(comparison.summary.memoryEfficiencyChange).toBeCloseTo(-10, 1); // 10% improvement
    });
  });

  describe('Memory tracking', () => {
    it('should track memory usage during benchmarks', async () => {
      const result = await benchmarkFreshnessCalculation();
      
      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage?.before).toBeDefined();
      expect(result.memoryUsage?.after).toBeDefined();
      expect(result.memoryUsage?.peak).toBeDefined();
      expect(result.memoryUsage?.peak).toBeGreaterThanOrEqual(result.memoryUsage?.before || 0);
    });

    it('should handle missing performance.memory', async () => {
      const originalMemory = mockPerformance.memory;
      delete (mockPerformance as any).memory;
      
      const result = await benchmarkFreshnessCalculation();
      
      expect(result.memoryUsage?.before).toBe(0);
      expect(result.memoryUsage?.after).toBe(0);
      expect(result.memoryUsage?.peak).toBe(0);
      
      // Restore memory
      mockPerformance.memory = originalMemory;
    });
  });
});