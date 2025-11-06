import { describe, it, expect, beforeEach } from 'vitest';
import { calculateFreshness, calculateFreshnessForTasks } from '../freshness';
import { performanceMonitor } from '../performance';
import type { Task } from '../../types';

// Helper to create test tasks
function createTestTask(id: string, daysFromNow: number): Task {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysFromNow);
  
  return {
    id,
    title: `Test Task ${id}`,
    description: 'Test description',
    dueDate,
    createdAt: new Date(),
    priority: 'medium',
    completed: false,
    freshnessState: '新規',
  };
}

describe('Freshness Calculation Performance', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  it('should calculate freshness for single task efficiently', () => {
    const task = createTestTask('1', 2);
    
    performanceMonitor.start('single-freshness');
    
    // Run calculation multiple times to test memoization
    for (let i = 0; i < 1000; i++) {
      calculateFreshness(task);
    }
    
    const duration = performanceMonitor.end('single-freshness');
    
    // Should be very fast due to memoization
    expect(duration).toBeLessThan(50); // Less than 50ms for 1000 calculations
  });

  it('should calculate freshness for multiple tasks efficiently', () => {
    // Create a large number of tasks
    const tasks: Task[] = [];
    for (let i = 0; i < 1000; i++) {
      tasks.push(createTestTask(`task-${i}`, Math.floor(Math.random() * 10) - 2));
    }
    
    performanceMonitor.start('batch-freshness');
    
    const results = calculateFreshnessForTasks(tasks);
    
    const duration = performanceMonitor.end('batch-freshness');
    
    // Should process 1000 tasks quickly
    expect(duration).toBeLessThan(100); // Less than 100ms for 1000 tasks
    expect(results.size).toBe(tasks.length);
  });

  it('should demonstrate memoization benefits', () => {
    const task = createTestTask('memoization-test', 5);
    
    // First calculation (not memoized)
    performanceMonitor.start('first-calc');
    calculateFreshness(task);
    const firstDuration = performanceMonitor.end('first-calc');
    
    // Second calculation (should be memoized)
    performanceMonitor.start('second-calc');
    calculateFreshness(task);
    const secondDuration = performanceMonitor.end('second-calc');
    
    // Memoized calculation should be significantly faster
    expect(secondDuration).toBeLessThan(firstDuration);
  });

  it('should handle large batch processing efficiently', () => {
    // Create 5000 tasks to test scalability
    const tasks: Task[] = [];
    for (let i = 0; i < 5000; i++) {
      tasks.push(createTestTask(`large-batch-${i}`, Math.floor(Math.random() * 20) - 5));
    }
    
    performanceMonitor.start('large-batch');
    
    const results = calculateFreshnessForTasks(tasks);
    
    const duration = performanceMonitor.end('large-batch');
    
    // Should handle large batches efficiently
    expect(duration).toBeLessThan(500); // Less than 500ms for 5000 tasks
    expect(results.size).toBe(tasks.length);
    
    // Verify all tasks were processed
    tasks.forEach(task => {
      expect(results.has(task.id)).toBe(true);
    });
  });

  it('should maintain performance with repeated calculations', () => {
    const tasks: Task[] = [];
    for (let i = 0; i < 100; i++) {
      tasks.push(createTestTask(`repeated-${i}`, Math.floor(Math.random() * 10)));
    }
    
    const durations: number[] = [];
    
    // Run multiple iterations
    for (let iteration = 0; iteration < 10; iteration++) {
      performanceMonitor.start(`iteration-${iteration}`);
      calculateFreshnessForTasks(tasks);
      durations.push(performanceMonitor.end(`iteration-${iteration}`));
    }
    
    // Performance should remain consistent (no memory leaks or degradation)
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    // Variance should be reasonable
    expect(maxDuration - minDuration).toBeLessThan(avgDuration * 2);
    expect(avgDuration).toBeLessThan(50); // Average should be fast
  });

  it('should show performance statistics', () => {
    const task = createTestTask('stats-test', 1);
    
    // Run multiple calculations
    for (let i = 0; i < 100; i++) {
      performanceMonitor.start('stats-calc');
      calculateFreshness(task);
      performanceMonitor.end('stats-calc');
    }
    
    const stats = performanceMonitor.getStats('stats-calc');
    
    expect(stats.count).toBe(100);
    expect(stats.avg).toBeGreaterThan(0);
    expect(stats.min).toBeGreaterThan(0);
    expect(stats.max).toBeGreaterThan(stats.min);
    
    console.log('Freshness Calculation Performance Stats:', {
      averageTime: `${stats.avg.toFixed(3)}ms`,
      minTime: `${stats.min.toFixed(3)}ms`,
      maxTime: `${stats.max.toFixed(3)}ms`,
      totalCalls: stats.count,
    });
  });
});