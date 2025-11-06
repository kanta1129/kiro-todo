/**
 * Enhanced Freshness Updater with Real-time Features
 * Provides advanced freshness updating with debouncing, batching, and performance optimization
 * Requirements: 2.4, 5.1
 */

import { useTaskStore } from '../stores/taskStore';
import { calculateFreshness, calculateFreshnessForTasks } from './freshness';
import type { Task, FreshnessState } from '../types';

/**
 * Configuration for enhanced freshness updates
 */
interface EnhancedFreshnessConfig {
  /** Debounce delay in milliseconds (default: 1000) */
  debounceDelay?: number;
  /** Batch size for processing tasks (default: 10) */
  batchSize?: number;
  /** Maximum processing time per batch in milliseconds (default: 50) */
  maxBatchTime?: number;
  /** Whether to use requestAnimationFrame for smooth updates (default: true) */
  useAnimationFrame?: boolean;
  /** Whether to log performance metrics (default: false) */
  logPerformance?: boolean;
}

/**
 * Result of a freshness update operation
 */
interface FreshnessUpdateResult {
  /** Number of tasks that were updated */
  updatedCount: number;
  /** Total number of tasks processed */
  totalProcessed: number;
  /** Time taken for the update in milliseconds */
  processingTime: number;
  /** Tasks that changed state */
  changedTasks: Array<{
    id: string;
    oldState: FreshnessState;
    newState: FreshnessState;
  }>;
  /** Whether the update was debounced */
  wasDebounced: boolean;
}

/**
 * Enhanced freshness updater class
 */
class EnhancedFreshnessUpdater {
  private config: Required<EnhancedFreshnessConfig>;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private updateQueue: Array<() => void> = [];
  private performanceMetrics: Array<{
    timestamp: number;
    processingTime: number;
    updatedCount: number;
    totalProcessed: number;
  }> = [];

  constructor(config: EnhancedFreshnessConfig = {}) {
    this.config = {
      debounceDelay: config.debounceDelay ?? 1000,
      batchSize: config.batchSize ?? 10,
      maxBatchTime: config.maxBatchTime ?? 50,
      useAnimationFrame: config.useAnimationFrame ?? true,
      logPerformance: config.logPerformance ?? false,
    };
  }

  /**
   * Update freshness states with debouncing and batching
   */
  async updateFreshnessStates(): Promise<FreshnessUpdateResult> {
    return new Promise((resolve) => {
      // Clear existing debounce timeout
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      // Set up debounced update
      this.debounceTimeout = setTimeout(async () => {
        const result = await this.performUpdate();
        resolve({ ...result, wasDebounced: true });
      }, this.config.debounceDelay);
    });
  }

  /**
   * Force immediate update without debouncing
   */
  async forceUpdate(): Promise<FreshnessUpdateResult> {
    // Clear any pending debounced update
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    const result = await this.performUpdate();
    return { ...result, wasDebounced: false };
  }

  /**
   * Check if updates are needed without performing them
   */
  checkForUpdates(): { needsUpdate: boolean; taskCount: number } {
    const store = useTaskStore.getState();
    const activeTasks = store.tasks.filter(task => !task.completed);
    
    if (activeTasks.length === 0) {
      return { needsUpdate: false, taskCount: 0 };
    }

    const freshnessResults = calculateFreshnessForTasks(activeTasks);
    const needsUpdate = Array.from(freshnessResults.values()).some(result => result.shouldUpdate);

    return { needsUpdate, taskCount: activeTasks.length };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const recent = this.performanceMetrics.slice(-10); // Last 10 updates
    
    if (recent.length === 0) {
      return {
        averageProcessingTime: 0,
        averageUpdatedCount: 0,
        averageTotalProcessed: 0,
        totalUpdates: 0,
      };
    }

    return {
      averageProcessingTime: recent.reduce((sum, m) => sum + m.processingTime, 0) / recent.length,
      averageUpdatedCount: recent.reduce((sum, m) => sum + m.updatedCount, 0) / recent.length,
      averageTotalProcessed: recent.reduce((sum, m) => sum + m.totalProcessed, 0) / recent.length,
      totalUpdates: this.performanceMetrics.length,
    };
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EnhancedFreshnessConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Perform the actual freshness update
   */
  private async performUpdate(): Promise<Omit<FreshnessUpdateResult, 'wasDebounced'>> {
    if (this.isUpdating) {
      // If already updating, queue this request
      return new Promise((resolve) => {
        this.updateQueue.push(() => {
          this.performUpdate().then(resolve);
        });
      });
    }

    this.isUpdating = true;
    const startTime = performance.now();

    try {
      const store = useTaskStore.getState();
      const activeTasks = store.tasks.filter(task => !task.completed);

      if (activeTasks.length === 0) {
        return {
          updatedCount: 0,
          totalProcessed: 0,
          processingTime: 0,
          changedTasks: [],
        };
      }

      // Process tasks in batches for better performance
      const changedTasks: Array<{
        id: string;
        oldState: FreshnessState;
        newState: FreshnessState;
      }> = [];

      let updatedCount = 0;
      const totalProcessed = activeTasks.length;

      // Use animation frame for smooth updates if configured
      if (this.config.useAnimationFrame) {
        await this.processBatchesWithAnimationFrame(activeTasks, changedTasks);
      } else {
        await this.processBatchesSync(activeTasks, changedTasks);
      }

      // Apply all changes at once for better performance
      if (changedTasks.length > 0) {
        store.updateFreshnessStates();
        updatedCount = changedTasks.length;
      }

      const processingTime = performance.now() - startTime;

      // Record performance metrics
      this.recordPerformanceMetrics({
        timestamp: Date.now(),
        processingTime,
        updatedCount,
        totalProcessed,
      });

      if (this.config.logPerformance) {
        console.log(`Freshness update completed: ${updatedCount}/${totalProcessed} tasks updated in ${processingTime.toFixed(2)}ms`);
      }

      return {
        updatedCount,
        totalProcessed,
        processingTime,
        changedTasks,
      };

    } finally {
      this.isUpdating = false;
      
      // Process any queued updates
      if (this.updateQueue.length > 0) {
        const nextUpdate = this.updateQueue.shift();
        if (nextUpdate) {
          setTimeout(nextUpdate, 0);
        }
      }
    }
  }

  /**
   * Process task batches using requestAnimationFrame for smooth updates
   */
  private async processBatchesWithAnimationFrame(
    tasks: Task[],
    changedTasks: Array<{ id: string; oldState: FreshnessState; newState: FreshnessState }>
  ): Promise<void> {
    return new Promise((resolve) => {
      let currentIndex = 0;

      const processBatch = () => {
        const batchStartTime = performance.now();
        const batchEndIndex = Math.min(currentIndex + this.config.batchSize, tasks.length);

        // Process current batch
        for (let i = currentIndex; i < batchEndIndex; i++) {
          const task = tasks[i];
          const oldState = task.freshnessState;
          const freshnessResult = calculateFreshness(task);
          
          if (freshnessResult.shouldUpdate && freshnessResult.state !== oldState) {
            changedTasks.push({
              id: task.id,
              oldState,
              newState: freshnessResult.state,
            });
          }

          // Check if we've exceeded the maximum batch processing time
          if (performance.now() - batchStartTime > this.config.maxBatchTime) {
            break;
          }
        }

        currentIndex = batchEndIndex;

        // Continue with next batch or finish
        if (currentIndex < tasks.length) {
          requestAnimationFrame(processBatch);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(processBatch);
    });
  }

  /**
   * Process task batches synchronously
   */
  private async processBatchesSync(
    tasks: Task[],
    changedTasks: Array<{ id: string; oldState: FreshnessState; newState: FreshnessState }>
  ): Promise<void> {
    for (let i = 0; i < tasks.length; i += this.config.batchSize) {
      const batch = tasks.slice(i, i + this.config.batchSize);
      
      for (const task of batch) {
        const oldState = task.freshnessState;
        const freshnessResult = calculateFreshness(task);
        
        if (freshnessResult.shouldUpdate && freshnessResult.state !== oldState) {
          changedTasks.push({
            id: task.id,
            oldState,
            newState: freshnessResult.state,
          });
        }
      }

      // Yield control to prevent blocking the main thread
      if (i + this.config.batchSize < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(metrics: {
    timestamp: number;
    processingTime: number;
    updatedCount: number;
    totalProcessed: number;
  }): void {
    this.performanceMetrics.push(metrics);
    
    // Keep only the last 50 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 50) {
      this.performanceMetrics = this.performanceMetrics.slice(-50);
    }
  }
}

// Global instance
let globalEnhancedUpdater: EnhancedFreshnessUpdater | null = null;

/**
 * Get or create the global enhanced freshness updater
 */
export function getEnhancedFreshnessUpdater(config?: EnhancedFreshnessConfig): EnhancedFreshnessUpdater {
  if (!globalEnhancedUpdater) {
    globalEnhancedUpdater = new EnhancedFreshnessUpdater(config);
  }
  return globalEnhancedUpdater;
}

/**
 * Update freshness states using the enhanced updater
 */
export async function updateFreshnessStatesEnhanced(config?: EnhancedFreshnessConfig): Promise<FreshnessUpdateResult> {
  const updater = getEnhancedUpdater(config);
  return updater.updateFreshnessStates();
}

/**
 * Force immediate freshness update
 */
export async function forceUpdateFreshnessStates(config?: EnhancedFreshnessConfig): Promise<FreshnessUpdateResult> {
  const updater = getEnhancedUpdater(config);
  return updater.forceUpdate();
}

/**
 * Check if freshness updates are needed
 */
export function checkFreshnessUpdatesNeeded(): { needsUpdate: boolean; taskCount: number } {
  const updater = getEnhancedUpdater();
  return updater.checkForUpdates();
}

/**
 * Get performance metrics for freshness updates
 */
export function getFreshnessUpdateMetrics() {
  const updater = getEnhancedUpdater();
  return updater.getPerformanceMetrics();
}

// Helper function to get updater with optional config
function getEnhancedUpdater(config?: EnhancedFreshnessConfig): EnhancedFreshnessUpdater {
  return getEnhancedFreshnessUpdater(config);
}