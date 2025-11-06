/**
 * Real-time Updates Demo Script
 * Demonstrates the automatic freshness updates and real-time features
 * Requirements: 2.4, 5.1
 */

import { useTaskStore } from '../stores/taskStore';
import { getEnhancedFreshnessUpdater } from '../lib/enhancedFreshnessUpdater';
import { getBackgroundTaskManager } from '../lib/backgroundTaskManager';

/**
 * Demo function to test real-time updates
 */
export async function demonstrateRealTimeUpdates() {
  console.log('🚀 Starting Real-time Updates Demo');
  
  // 1. Set up interval-based freshness state updates
  console.log('\n1️⃣ Setting up interval-based updates...');
  
  const store = useTaskStore.getState();
  
  // Add some test tasks with different due dates
  const testTasks = [
    {
      title: 'Fresh Task',
      description: 'This task is fresh',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      priority: 'medium' as const,
    },
    {
      title: 'Approaching Task',
      description: 'This task is approaching deadline',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: 'high' as const,
    },
    {
      title: 'Near Deadline Task',
      description: 'This task is near deadline',
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      priority: 'high' as const,
    },
    {
      title: 'Overdue Task',
      description: 'This task is overdue',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      priority: 'medium' as const,
    },
  ];

  testTasks.forEach(task => store.addTask(task));
  console.log(`✅ Added ${testTasks.length} test tasks`);

  // 2. Add real-time visual updates without page refresh
  console.log('\n2️⃣ Testing real-time visual updates...');
  
  const enhancedUpdater = getEnhancedFreshnessUpdater({
    debounceDelay: 500,
    batchSize: 10,
    logPerformance: true,
  });

  // Perform initial update
  const initialResult = await enhancedUpdater.forceUpdate();
  console.log(`✅ Initial update: ${initialResult.updatedCount} tasks updated in ${initialResult.processingTime.toFixed(2)}ms`);

  // 3. Implement debounced update mechanism for performance
  console.log('\n3️⃣ Testing debounced updates...');
  
  // Trigger multiple rapid updates to test debouncing
  const rapidUpdates = [];
  for (let i = 0; i < 5; i++) {
    rapidUpdates.push(enhancedUpdater.updateFreshnessStates());
  }
  
  const debounceResults = await Promise.all(rapidUpdates);
  const totalDebounced = debounceResults.reduce((sum, result) => sum + result.updatedCount, 0);
  console.log(`✅ Debounced updates: ${totalDebounced} total updates from ${rapidUpdates.length} rapid calls`);

  // 4. Create background task for continuous freshness monitoring
  console.log('\n4️⃣ Testing background task monitoring...');
  
  const backgroundManager = getBackgroundTaskManager({
    primaryInterval: 5000,    // 5 seconds for demo
    secondaryInterval: 2000,  // 2 seconds for demo
    debug: true,
  });

  backgroundManager.start();
  console.log('✅ Background task manager started');

  // Wait a bit to see background updates
  await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

  const stats = backgroundManager.getStats();
  console.log(`✅ Background stats: ${stats.totalCycles} cycles, ${stats.totalTasksUpdated} tasks updated`);

  // Get performance metrics
  console.log('\n📊 Performance Metrics:');
  const enhancedMetrics = enhancedUpdater.getPerformanceMetrics();
  console.log(`- Average processing time: ${enhancedMetrics.averageProcessingTime.toFixed(2)}ms`);
  console.log(`- Average updated count: ${enhancedMetrics.averageUpdatedCount.toFixed(1)}`);
  console.log(`- Total updates: ${enhancedMetrics.totalUpdates}`);

  // Check freshness states
  console.log('\n🎯 Current Task States:');
  const currentTasks = store.tasks.filter(task => !task.completed);
  currentTasks.forEach(task => {
    console.log(`- ${task.title}: ${task.freshnessState} (due: ${task.dueDate.toLocaleString()})`);
  });

  // Stop background manager
  backgroundManager.stop();
  console.log('\n🛑 Background task manager stopped');

  console.log('\n✨ Real-time Updates Demo Complete!');
  
  return {
    tasksCreated: testTasks.length,
    initialUpdates: initialResult.updatedCount,
    debounceUpdates: totalDebounced,
    backgroundCycles: stats.totalCycles,
    backgroundUpdates: stats.totalTasksUpdated,
    performanceMetrics: enhancedMetrics,
  };
}

/**
 * Quick test to verify real-time functionality
 */
export function quickRealTimeTest() {
  console.log('⚡ Quick Real-time Test');
  
  const store = useTaskStore.getState();
  const enhancedUpdater = getEnhancedFreshnessUpdater();
  
  // Check if updates are needed
  const { needsUpdate, taskCount } = enhancedUpdater.checkForUpdates();
  console.log(`📋 Tasks: ${taskCount}, Updates needed: ${needsUpdate}`);
  
  // Test performance metrics
  const metrics = enhancedUpdater.getPerformanceMetrics();
  console.log(`📈 Performance: ${metrics.totalUpdates} updates, avg ${metrics.averageProcessingTime.toFixed(2)}ms`);
  
  return { taskCount, needsUpdate, totalUpdates: metrics.totalUpdates };
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  (window as any).realTimeDemo = {
    demonstrate: demonstrateRealTimeUpdates,
    quickTest: quickRealTimeTest,
  };
}