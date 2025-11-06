/**
 * Performance benchmarks for the Task Freshness TODO application
 * Requirements: 2.4
 */

import { Task, FreshnessState } from '../types/task';
import { calculateFreshness } from './freshness';

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  summary: {
    totalTime: number;
    averageOpsPerSecond: number;
    memoryEfficiency: number;
  };
}

/**
 * Create mock tasks for benchmarking
 */
function createMockTasks(count: number): Task[] {
  const tasks: Task[] = [];
  const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  
  for (let i = 0; i < count; i++) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 10) - 5); // -5 to +5 days
    
    tasks.push({
      id: `task-${i}`,
      title: `Task ${i}`,
      description: `Description for task ${i}`,
      dueDate,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random creation time within last week
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      completed: false,
      freshnessState: '新規' as FreshnessState,
    });
  }
  
  return tasks;
}

/**
 * Get memory usage if available
 */
function getMemoryUsage(): number {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

/**
 * Run a single benchmark
 */
async function runBenchmark(
  name: string,
  operation: () => void | Promise<void>,
  iterations: number = 1000,
  warmupIterations: number = 10
): Promise<BenchmarkResult> {
  // Warm up
  for (let i = 0; i < warmupIterations; i++) {
    await operation();
  }
  
  // Force garbage collection if available
  if (typeof window !== 'undefined' && 'gc' in window) {
    (window as any).gc();
  }
  
  const memoryBefore = getMemoryUsage();
  const times: number[] = [];
  let peakMemory = memoryBefore;
  
  // Run benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await operation();
    const end = performance.now();
    times.push(end - start);
    
    // Track peak memory usage
    const currentMemory = getMemoryUsage();
    if (currentMemory > peakMemory) {
      peakMemory = currentMemory;
    }
  }
  
  const memoryAfter = getMemoryUsage();
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSecond = 1000 / averageTime;
  
  return {
    name,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    opsPerSecond,
    memoryUsage: {
      before: memoryBefore,
      after: memoryAfter,
      peak: peakMemory,
    },
  };
}

/**
 * Benchmark freshness calculation performance
 */
export async function benchmarkFreshnessCalculation(): Promise<BenchmarkResult> {
  const tasks = createMockTasks(100);
  let taskIndex = 0;
  
  return runBenchmark(
    'Freshness Calculation',
    () => {
      const task = tasks[taskIndex % tasks.length];
      calculateFreshness(task);
      taskIndex++;
    },
    1000
  );
}

/**
 * Benchmark task store operations
 */
export async function benchmarkTaskStoreOperations(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  // Create task benchmark (simulate task creation)
  let taskCounter = 0;
  const createTaskBenchmark = await runBenchmark(
    'Task Creation',
    () => {
      // Simulate task creation without actual store
      const task = {
        id: `task-${taskCounter++}`,
        title: `Benchmark Task ${taskCounter}`,
        description: 'Benchmark description',
        dueDate: new Date(),
        createdAt: new Date(),
        priority: 'medium' as const,
        completed: false,
        freshnessState: '新規' as FreshnessState,
      };
      // Simulate some processing
      JSON.stringify(task);
    },
    500
  );
  results.push(createTaskBenchmark);
  
  // Update task benchmark
  const tasks = createMockTasks(100);
  let updateIndex = 0;
  const updateTaskBenchmark = await runBenchmark(
    'Task Update',
    () => {
      const task = tasks[updateIndex % tasks.length];
      // Simulate task update
      const updatedTask = {
        ...task,
        title: `Updated ${task.title}`,
        priority: 'high' as const,
      };
      // Simulate processing
      JSON.stringify(updatedTask);
      updateIndex++;
    },
    500
  );
  results.push(updateTaskBenchmark);
  
  // Freshness state update benchmark
  let freshnessIndex = 0;
  const freshnessUpdateBenchmark = await runBenchmark(
    'Freshness State Update',
    () => {
      const task = tasks[freshnessIndex % tasks.length];
      calculateFreshness(task);
      freshnessIndex++;
    },
    1000
  );
  results.push(freshnessUpdateBenchmark);
  
  return results;
}

/**
 * Benchmark large dataset performance
 */
export async function benchmarkLargeDataset(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  // Test with different dataset sizes
  const sizes = [100, 500, 1000, 5000];
  
  for (const size of sizes) {
    const tasks = createMockTasks(size);
    
    const batchProcessingBenchmark = await runBenchmark(
      `Batch Processing (${size} tasks)`,
      () => {
        tasks.forEach(task => {
          calculateFreshness(task);
        });
      },
      size > 1000 ? 10 : 50 // Fewer iterations for larger datasets
    );
    
    results.push(batchProcessingBenchmark);
  }
  
  return results;
}

/**
 * Benchmark component rendering performance
 */
export async function benchmarkComponentRendering(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  // Simulate DOM operations
  const domOperationBenchmark = await runBenchmark(
    'DOM Operations',
    () => {
      const element = document.createElement('div');
      element.className = 'task-item fresh';
      element.innerHTML = '<span>Task Title</span><span>Due Date</span>';
      document.body.appendChild(element);
      document.body.removeChild(element);
    },
    500
  );
  results.push(domOperationBenchmark);
  
  // Simulate CSS class changes
  const cssUpdateBenchmark = await runBenchmark(
    'CSS Class Updates',
    () => {
      const element = document.createElement('div');
      element.className = 'task-item';
      
      // Simulate freshness state changes
      const states = ['fresh', 'approaching', 'urgent', 'overdue'];
      states.forEach(state => {
        element.className = `task-item ${state}`;
      });
    },
    1000
  );
  results.push(cssUpdateBenchmark);
  
  return results;
}

/**
 * Run comprehensive performance benchmark suite
 */
export async function runPerformanceBenchmarkSuite(): Promise<BenchmarkSuite> {
  console.log('🚀 Starting performance benchmark suite...');
  
  const results: BenchmarkResult[] = [];
  
  // Individual benchmarks
  console.log('📊 Running freshness calculation benchmark...');
  const freshnessResult = await benchmarkFreshnessCalculation();
  results.push(freshnessResult);
  
  console.log('🏪 Running task store benchmarks...');
  const storeResults = await benchmarkTaskStoreOperations();
  results.push(...storeResults);
  
  console.log('📈 Running large dataset benchmarks...');
  const datasetResults = await benchmarkLargeDataset();
  results.push(...datasetResults);
  
  console.log('🎨 Running component rendering benchmarks...');
  const renderingResults = await benchmarkComponentRendering();
  results.push(...renderingResults);
  
  // Calculate summary
  const totalTime = results.reduce((sum, result) => sum + result.totalTime, 0);
  const averageOpsPerSecond = results.reduce((sum, result) => sum + result.opsPerSecond, 0) / results.length;
  
  // Calculate memory efficiency (lower is better)
  const memoryResults = results.filter(r => r.memoryUsage);
  const memoryEfficiency = memoryResults.length > 0
    ? memoryResults.reduce((sum, result) => {
        const memoryDiff = result.memoryUsage!.after - result.memoryUsage!.before;
        return sum + (memoryDiff / result.iterations);
      }, 0) / memoryResults.length
    : 0;
  
  const suite: BenchmarkSuite = {
    name: 'Task Freshness TODO Performance Suite',
    results,
    summary: {
      totalTime,
      averageOpsPerSecond,
      memoryEfficiency,
    },
  };
  
  console.log('✅ Benchmark suite completed!');
  return suite;
}

/**
 * Generate benchmark report
 */
export function generateBenchmarkReport(suite: BenchmarkSuite): string {
  let report = `# ${suite.name} - Benchmark Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  // Summary
  report += '## Summary\n\n';
  report += `- **Total Execution Time:** ${suite.summary.totalTime.toFixed(2)}ms\n`;
  report += `- **Average Operations/Second:** ${suite.summary.averageOpsPerSecond.toFixed(0)}\n`;
  report += `- **Memory Efficiency:** ${suite.summary.memoryEfficiency.toFixed(2)} bytes/operation\n\n`;
  
  // Individual results
  report += '## Detailed Results\n\n';
  
  suite.results.forEach(result => {
    report += `### ${result.name}\n\n`;
    report += `- **Iterations:** ${result.iterations.toLocaleString()}\n`;
    report += `- **Total Time:** ${result.totalTime.toFixed(2)}ms\n`;
    report += `- **Average Time:** ${result.averageTime.toFixed(4)}ms\n`;
    report += `- **Min Time:** ${result.minTime.toFixed(4)}ms\n`;
    report += `- **Max Time:** ${result.maxTime.toFixed(4)}ms\n`;
    report += `- **Operations/Second:** ${result.opsPerSecond.toFixed(0)}\n`;
    
    if (result.memoryUsage) {
      const memoryDiff = result.memoryUsage.after - result.memoryUsage.before;
      const peakDiff = result.memoryUsage.peak - result.memoryUsage.before;
      report += `- **Memory Usage:** ${formatBytes(memoryDiff)} (Peak: ${formatBytes(peakDiff)})\n`;
    }
    
    report += '\n';
  });
  
  // Performance grades
  report += '## Performance Grades\n\n';
  
  suite.results.forEach(result => {
    let grade = 'A';
    let comment = 'Excellent performance';
    
    if (result.averageTime > 10) {
      grade = 'D';
      comment = 'Needs optimization';
    } else if (result.averageTime > 5) {
      grade = 'C';
      comment = 'Room for improvement';
    } else if (result.averageTime > 1) {
      grade = 'B';
      comment = 'Good performance';
    }
    
    report += `- **${result.name}:** Grade ${grade} - ${comment}\n`;
  });
  
  report += '\n';
  
  // Recommendations
  report += '## Recommendations\n\n';
  
  const slowOperations = suite.results.filter(r => r.averageTime > 1);
  if (slowOperations.length > 0) {
    report += '### Performance Improvements\n\n';
    slowOperations.forEach(op => {
      report += `- Optimize "${op.name}" - currently ${op.averageTime.toFixed(2)}ms average\n`;
    });
    report += '\n';
  }
  
  const memoryIntensive = suite.results.filter(r => 
    r.memoryUsage && (r.memoryUsage.after - r.memoryUsage.before) > 1000000 // 1MB
  );
  if (memoryIntensive.length > 0) {
    report += '### Memory Optimizations\n\n';
    memoryIntensive.forEach(op => {
      const memoryDiff = op.memoryUsage!.after - op.memoryUsage!.before;
      report += `- Reduce memory usage in "${op.name}" - currently using ${formatBytes(memoryDiff)}\n`;
    });
    report += '\n';
  }
  
  report += '### General Recommendations\n\n';
  report += '- Monitor performance regularly with automated benchmarks\n';
  report += '- Set up performance budgets and alerts\n';
  report += '- Use React.memo and useMemo for expensive operations\n';
  report += '- Implement virtual scrolling for large lists\n';
  report += '- Consider Web Workers for heavy computations\n';
  
  return report;
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Export benchmark results
 */
export function exportBenchmarkResults(suite: BenchmarkSuite): void {
  const data = {
    ...suite,
    exported: new Date().toISOString(),
    environment: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
      memory: typeof performance !== 'undefined' && 'memory' in performance 
        ? (performance as any).memory 
        : null,
    },
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-benchmarks-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Compare benchmark results
 */
export function compareBenchmarkResults(
  current: BenchmarkSuite,
  previous: BenchmarkSuite
): {
  improvements: string[];
  regressions: string[];
  summary: {
    totalTimeChange: number;
    opsPerSecondChange: number;
    memoryEfficiencyChange: number;
  };
} {
  const improvements: string[] = [];
  const regressions: string[] = [];
  
  current.results.forEach(currentResult => {
    const previousResult = previous.results.find(r => r.name === currentResult.name);
    if (!previousResult) return;
    
    const timeChange = ((currentResult.averageTime - previousResult.averageTime) / previousResult.averageTime) * 100;
    const opsChange = ((currentResult.opsPerSecond - previousResult.opsPerSecond) / previousResult.opsPerSecond) * 100;
    
    if (timeChange < -5) { // 5% improvement
      improvements.push(`${currentResult.name}: ${Math.abs(timeChange).toFixed(1)}% faster`);
    } else if (timeChange > 5) { // 5% regression
      regressions.push(`${currentResult.name}: ${timeChange.toFixed(1)}% slower`);
    }
  });
  
  const totalTimeChange = ((current.summary.totalTime - previous.summary.totalTime) / previous.summary.totalTime) * 100;
  const opsPerSecondChange = ((current.summary.averageOpsPerSecond - previous.summary.averageOpsPerSecond) / previous.summary.averageOpsPerSecond) * 100;
  const memoryEfficiencyChange = ((current.summary.memoryEfficiency - previous.summary.memoryEfficiency) / previous.summary.memoryEfficiency) * 100;
  
  return {
    improvements,
    regressions,
    summary: {
      totalTimeChange,
      opsPerSecondChange,
      memoryEfficiencyChange,
    },
  };
}