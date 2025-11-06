/**
 * Background Task Manager for Freshness Monitoring
 * Handles continuous monitoring and updating of task freshness states
 * Requirements: 2.4, 5.1
 */

import { useTaskStore } from '../stores/taskStore';

/**
 * Configuration for background task monitoring
 */
interface BackgroundTaskConfig {
  /** Primary update interval in milliseconds (default: 60000 = 1 minute) */
  primaryInterval?: number;
  /** Secondary check interval in milliseconds (default: 10000 = 10 seconds) */
  secondaryInterval?: number;
  /** Maximum number of consecutive errors before stopping (default: 5) */
  maxErrors?: number;
  /** Whether to log debug information (default: false) */
  debug?: boolean;
  /** Whether to pause when page is hidden (default: true) */
  pauseOnHidden?: boolean;
}

/**
 * Statistics for background task monitoring
 */
export interface BackgroundTaskStats {
  /** Total number of update cycles completed */
  totalCycles: number;
  /** Total number of tasks updated */
  totalTasksUpdated: number;
  /** Number of consecutive errors */
  consecutiveErrors: number;
  /** Timestamp of last successful update */
  lastSuccessfulUpdate: number;
  /** Timestamp of last error */
  lastError: number | null;
  /** Average time between updates (in milliseconds) */
  averageUpdateInterval: number;
  /** Whether the background task is currently running */
  isRunning: boolean;
  /** Whether the background task is paused */
  isPaused: boolean;
}

/**
 * Background task manager class
 */
class BackgroundTaskManager {
  private config: Required<BackgroundTaskConfig>;
  private stats: BackgroundTaskStats;
  private primaryTimer: NodeJS.Timeout | null = null;
  private secondaryTimer: NodeJS.Timeout | null = null;
  private isVisible: boolean = true;
  private updateTimes: number[] = [];

  constructor(config: BackgroundTaskConfig = {}) {
    this.config = {
      primaryInterval: config.primaryInterval ?? 60000,
      secondaryInterval: config.secondaryInterval ?? 10000,
      maxErrors: config.maxErrors ?? 5,
      debug: config.debug ?? false,
      pauseOnHidden: config.pauseOnHidden ?? true,
    };

    this.stats = {
      totalCycles: 0,
      totalTasksUpdated: 0,
      consecutiveErrors: 0,
      lastSuccessfulUpdate: Date.now(),
      lastError: null,
      averageUpdateInterval: this.config.primaryInterval,
      isRunning: false,
      isPaused: false,
    };

    this.setupVisibilityHandling();
  }

  /**
   * Start the background task monitoring
   */
  start(): void {
    if (this.stats.isRunning) {
      this.log('Background task already running');
      return;
    }

    this.log('Starting background task monitoring');
    this.stats.isRunning = true;
    this.stats.isPaused = false;
    this.stats.consecutiveErrors = 0;

    this.startPrimaryTimer();
    this.startSecondaryTimer();
  }

  /**
   * Stop the background task monitoring
   */
  stop(): void {
    if (!this.stats.isRunning) {
      this.log('Background task not running');
      return;
    }

    this.log('Stopping background task monitoring');
    this.stats.isRunning = false;
    this.stats.isPaused = false;

    this.clearTimers();
  }

  /**
   * Pause the background task monitoring
   */
  pause(): void {
    if (!this.stats.isRunning || this.stats.isPaused) {
      return;
    }

    this.log('Pausing background task monitoring');
    this.stats.isPaused = true;
    this.clearTimers();
  }

  /**
   * Resume the background task monitoring
   */
  resume(): void {
    if (!this.stats.isRunning || !this.stats.isPaused) {
      return;
    }

    this.log('Resuming background task monitoring');
    this.stats.isPaused = false;
    this.startPrimaryTimer();
    this.startSecondaryTimer();
  }

  /**
   * Get current statistics
   */
  getStats(): Readonly<BackgroundTaskStats> {
    return { ...this.stats };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BackgroundTaskConfig>): void {
    const wasRunning = this.stats.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Force an immediate update cycle
   */
  async forceUpdate(): Promise<number> {
    this.log('Forcing immediate update');
    return this.performUpdate('manual');
  }

  /**
   * Start the primary update timer
   */
  private startPrimaryTimer(): void {
    this.primaryTimer = setInterval(() => {
      if (!this.shouldUpdate()) return;
      this.performUpdate('primary');
    }, this.config.primaryInterval);
  }

  /**
   * Start the secondary check timer (for quick checks)
   */
  private startSecondaryTimer(): void {
    this.secondaryTimer = setInterval(() => {
      if (!this.shouldUpdate()) return;
      this.performQuickCheck();
    }, this.config.secondaryInterval);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.primaryTimer) {
      clearInterval(this.primaryTimer);
      this.primaryTimer = null;
    }

    if (this.secondaryTimer) {
      clearInterval(this.secondaryTimer);
      this.secondaryTimer = null;
    }
  }

  /**
   * Check if updates should be performed
   */
  private shouldUpdate(): boolean {
    if (!this.stats.isRunning || this.stats.isPaused) {
      return false;
    }

    if (this.config.pauseOnHidden && !this.isVisible) {
      return false;
    }

    if (this.stats.consecutiveErrors >= this.config.maxErrors) {
      this.log(`Too many consecutive errors (${this.stats.consecutiveErrors}), stopping background task`);
      this.stop();
      return false;
    }

    return true;
  }

  /**
   * Perform a full update cycle with enhanced monitoring
   */
  private async performUpdate(source: 'primary' | 'secondary' | 'manual'): Promise<number> {
    const startTime = Date.now();
    
    try {
      this.log(`Performing ${source} update cycle`);
      
      // Get the current store state
      const store = useTaskStore.getState();
      
      // Check if there are any active tasks that need updating
      const activeTasks = store.tasks.filter(task => !task.completed);
      if (activeTasks.length === 0) {
        this.log('No active tasks to update');
        return 0;
      }

      // Capture state before update for accurate change detection
      const beforeStates = activeTasks.map(task => ({
        id: task.id,
        state: task.freshnessState,
        dueDate: task.dueDate.getTime(),
      }));

      // Perform the enhanced freshness update
      const updatedCount = await store.updateFreshnessStatesEnhanced();
      
      // Get updated tasks to verify changes
      const afterTasks = store.tasks.filter(task => !task.completed);
      const actualChanges = beforeStates.filter(before => {
        const after = afterTasks.find(task => task.id === before.id);
        return after && after.freshnessState !== before.state;
      }).length;

      // Update statistics with accurate counts
      this.stats.totalCycles++;
      this.stats.totalTasksUpdated += actualChanges;
      this.stats.lastSuccessfulUpdate = Date.now();
      this.stats.consecutiveErrors = 0;

      // Track update timing with more precision
      const updateTime = Date.now() - startTime;
      this.updateTimes.push(updateTime);
      if (this.updateTimes.length > 20) {
        this.updateTimes.shift(); // Keep last 20 measurements for better averaging
      }
      
      this.stats.averageUpdateInterval = this.updateTimes.reduce((a, b) => a + b, 0) / this.updateTimes.length;

      // Enhanced logging with more details
      if (actualChanges > 0) {
        this.log(`Update cycle completed: ${actualChanges}/${activeTasks.length} tasks updated in ${updateTime}ms (${source})`);
      } else {
        this.log(`Update cycle completed: No changes needed for ${activeTasks.length} tasks in ${updateTime}ms (${source})`);
      }

      return actualChanges;

    } catch (error) {
      this.handleError(error as Error);
      return 0;
    }
  }

  /**
   * Perform a quick check with enhanced transition detection
   */
  private async performQuickCheck(): Promise<void> {
    try {
      this.log('Performing quick freshness check');
      
      const store = useTaskStore.getState();
      const activeTasks = store.tasks.filter(task => !task.completed);
      
      if (activeTasks.length === 0) {
        return;
      }

      // Enhanced quick check: look for tasks approaching state transitions
      const now = Date.now();
      const criticalTasks = activeTasks.filter(task => {
        const dueTime = new Date(task.dueDate).getTime();
        const timeUntilDue = dueTime - now;
        
        // Priority-based transition windows
        const priorityMultiplier = {
          high: 0.8,    // Tighter windows for high priority
          medium: 1.0,  // Normal windows
          low: 1.2      // Looser windows for low priority
        };
        
        const multiplier = priorityMultiplier[task.priority];
        
        // Check multiple transition points with priority adjustment
        const transitions = [
          0,                                    // Overdue transition
          1 * 24 * 60 * 60 * 1000 * multiplier, // 期限間近 transition
          3 * 24 * 60 * 60 * 1000 * multiplier, // 期限接近 transition
        ];
        
        return transitions.some(transition => {
          const timeDiff = Math.abs(timeUntilDue - transition);
          return timeDiff < 10 * 60 * 1000; // Within 10 minutes of transition
        });
      });

      // Also check for tasks that might need visual updates due to animations
      const animationTasks = activeTasks.filter(task => {
        const timeUntilDue = new Date(task.dueDate).getTime() - now;
        // Tasks in decay states might need frequent visual updates
        return task.freshnessState === '期限間近' || task.freshnessState === '期限切れ';
      });

      const totalUrgentTasks = new Set([...criticalTasks, ...animationTasks]).size;

      if (totalUrgentTasks > 0) {
        this.log(`Found ${criticalTasks.length} critical + ${animationTasks.length} animation tasks, triggering update`);
        await this.performUpdate('secondary');
      } else {
        this.log(`Quick check: ${activeTasks.length} tasks stable, no updates needed`);
      }

    } catch (error) {
      this.log(`Quick check failed: ${error}`);
      // Don't count quick check errors as heavily as full update errors
    }
  }

  /**
   * Handle errors during updates
   */
  private handleError(error: Error): void {
    this.stats.consecutiveErrors++;
    this.stats.lastError = Date.now();
    
    this.log(`Update error (${this.stats.consecutiveErrors}/${this.config.maxErrors}): ${error.message}`);
    
    if (this.stats.consecutiveErrors >= this.config.maxErrors) {
      this.log('Maximum errors reached, stopping background task');
      this.stop();
    }
  }

  /**
   * Setup visibility change handling
   */
  private setupVisibilityHandling(): void {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const wasVisible = this.isVisible;
      this.isVisible = !document.hidden;

      if (this.config.pauseOnHidden) {
        if (!this.isVisible && wasVisible) {
          this.log('Page hidden, pausing background task');
          this.pause();
        } else if (this.isVisible && !wasVisible) {
          this.log('Page visible, resuming background task');
          this.resume();
          // Force an update when page becomes visible again
          this.performUpdate('manual');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Log debug messages
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[BackgroundTaskManager] ${message}`);
    }
  }
}

// Global instance
let globalBackgroundTaskManager: BackgroundTaskManager | null = null;

/**
 * Get or create the global background task manager instance
 */
export function getBackgroundTaskManager(config?: BackgroundTaskConfig): BackgroundTaskManager {
  if (!globalBackgroundTaskManager) {
    globalBackgroundTaskManager = new BackgroundTaskManager(config);
  }
  return globalBackgroundTaskManager;
}

/**
 * Start background monitoring with optional configuration
 */
export function startBackgroundMonitoring(config?: BackgroundTaskConfig): BackgroundTaskManager {
  const manager = getBackgroundTaskManager(config);
  manager.start();
  return manager;
}

/**
 * Stop background monitoring
 */
export function stopBackgroundMonitoring(): void {
  if (globalBackgroundTaskManager) {
    globalBackgroundTaskManager.stop();
  }
}

/**
 * Get background monitoring statistics
 */
export function getBackgroundMonitoringStats(): BackgroundTaskStats | null {
  return globalBackgroundTaskManager?.getStats() || null;
}

// Auto-start background monitoring in browser environment
if (typeof window !== 'undefined') {
  // Start with debug mode disabled by default
  startBackgroundMonitoring({ debug: false });
}