import { useCallback, useEffect, useRef, useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useFreshness } from './useFreshness';

/**
 * Configuration for real-time updates
 */
interface RealTimeUpdateConfig {
  /** Update interval in milliseconds (default: 60000 = 1 minute) */
  updateInterval?: number;
  /** Debounce delay in milliseconds (default: 1000) */
  debounceDelay?: number;
  /** Whether to update immediately on mount (default: true) */
  updateOnMount?: boolean;
  /** Whether to pause updates when tab is not visible (default: true) */
  pauseOnHidden?: boolean;
}

/**
 * Return type for useRealTimeUpdates hook
 */
interface UseRealTimeUpdatesReturn {
  /** Whether real-time updates are currently active */
  isActive: boolean;
  /** Whether an update is currently in progress */
  isUpdating: boolean;
  /** Number of tasks updated in the last update cycle */
  lastUpdateCount: number;
  /** Timestamp of the last update */
  lastUpdateTime: number;
  /** Time remaining until next scheduled update (in milliseconds) */
  timeUntilNextUpdate: number;
  /** Start real-time updates */
  start: () => void;
  /** Stop real-time updates */
  stop: () => void;
  /** Force an immediate update */
  forceUpdate: () => Promise<number>;
  /** Reset the update timer */
  resetTimer: () => void;
  /** Get performance metrics */
  getPerformanceMetrics: () => {
    averageDuration: number;
    averageUpdateCount: number;
    totalUpdates: number;
    lastUpdateDuration: number;
  };
}

/**
 * Custom hook for managing real-time freshness updates
 * Provides automatic, debounced updates with performance optimizations
 * Requirements: 2.4, 5.1
 */
export function useRealTimeUpdates(config: RealTimeUpdateConfig = {}): UseRealTimeUpdatesReturn {
  const {
    updateInterval = 60000, // 1 minute
    debounceDelay = 1000,   // 1 second
    updateOnMount = true,
    pauseOnHidden = true,
  } = config;

  // Store and freshness hooks
  const taskStore = useTaskStore();
  const { 
    hasPendingUpdates,
    isAutoUpdateActive,
    lastUpdateTime: freshnessLastUpdate
  } = useFreshness();

  // Local state
  const [isActive, setIsActive] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateCount, setLastUpdateCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState(updateInterval);

  // Refs for managing intervals and timeouts
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);
  const lastTaskCountRef = useRef(0);
  const performanceMetricsRef = useRef<Array<{ timestamp: number; duration: number; count: number }>>([]);

  // Debounced update function with enhanced performance tracking
  const debouncedUpdate = useCallback(async (): Promise<number> => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    return new Promise((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        if (!isActive || (pauseOnHidden && !isVisibleRef.current)) {
          resolve(0);
          return;
        }

        const startTime = performance.now();
        setIsUpdating(true);
        
        try {
          // Check if updates are actually needed
          const needsUpdate = hasPendingUpdates();
          if (!needsUpdate) {
            resolve(0);
            return;
          }

          // Get current task count for change detection
          const currentTaskCount = taskStore.tasks.filter(t => !t.completed).length;
          const taskCountChanged = currentTaskCount !== lastTaskCountRef.current;
          lastTaskCountRef.current = currentTaskCount;

          // Perform the update using enhanced updater
          const updatedCount = await taskStore.updateFreshnessStatesEnhanced();
          const now = Date.now();
          const duration = performance.now() - startTime;
          
          // Record performance metrics
          performanceMetricsRef.current.push({ timestamp: now, duration, count: updatedCount });
          if (performanceMetricsRef.current.length > 20) {
            performanceMetricsRef.current = performanceMetricsRef.current.slice(-20);
          }
          
          setLastUpdateCount(updatedCount);
          setLastUpdateTime(now);
          setTimeUntilNextUpdate(updateInterval);

          // Log performance for debugging
          if (updatedCount > 0 || taskCountChanged) {
            console.log(`Real-time update: ${updatedCount} tasks updated in ${duration.toFixed(2)}ms`);
          }

          resolve(updatedCount);
        } catch (error) {
          console.error('Error during real-time freshness update:', error);
          resolve(0);
        } finally {
          setIsUpdating(false);
        }
      }, debounceDelay);
    });
  }, [isActive, pauseOnHidden, hasPendingUpdates, updateInterval, debounceDelay, taskStore]);

  // Force immediate update with performance tracking
  const forceUpdate = useCallback(async (): Promise<number> => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    const startTime = performance.now();
    setIsUpdating(true);
    
    try {
      const updatedCount = await taskStore.updateFreshnessStatesEnhanced();
      const now = Date.now();
      const duration = performance.now() - startTime;
      
      // Record performance metrics
      performanceMetricsRef.current.push({ timestamp: now, duration, count: updatedCount });
      if (performanceMetricsRef.current.length > 20) {
        performanceMetricsRef.current = performanceMetricsRef.current.slice(-20);
      }
      
      setLastUpdateCount(updatedCount);
      setLastUpdateTime(now);
      setTimeUntilNextUpdate(updateInterval);
      
      console.log(`Force update: ${updatedCount} tasks updated in ${duration.toFixed(2)}ms`);
      
      return updatedCount;
    } catch (error) {
      console.error('Error during forced freshness update:', error);
      return 0;
    } finally {
      setIsUpdating(false);
    }
  }, [updateInterval, taskStore]);

  // Start real-time updates with adaptive intervals
  const start = useCallback(() => {
    if (isActive) return;

    console.log('Starting real-time freshness updates');
    setIsActive(true);

    // Initialize task count tracking
    lastTaskCountRef.current = taskStore.tasks.filter(t => !t.completed).length;

    // Perform initial update if configured
    if (updateOnMount) {
      debouncedUpdate();
    }

    // Set up the main update interval with adaptive timing
    updateIntervalRef.current = setInterval(() => {
      // Check if we need more frequent updates based on task urgency
      const urgentTasks = taskStore.tasks.filter(task => {
        if (task.completed) return false;
        const timeUntilDue = new Date(task.dueDate).getTime() - Date.now();
        return timeUntilDue < 2 * 60 * 60 * 1000; // Less than 2 hours
      });

      // Use shorter interval if there are urgent tasks
      const adaptiveInterval = urgentTasks.length > 0 ? Math.min(updateInterval, 30000) : updateInterval;
      
      debouncedUpdate();
    }, updateInterval);

    // Set up countdown timer for UI feedback with more precise updates
    countdownIntervalRef.current = setInterval(() => {
      setTimeUntilNextUpdate(prev => {
        const newTime = Math.max(0, prev - 1000);
        if (newTime === 0) {
          return updateInterval;
        }
        return newTime;
      });
    }, 1000);
  }, [isActive, updateOnMount, debouncedUpdate, updateInterval, taskStore]);

  // Stop real-time updates
  const stop = useCallback(() => {
    setIsActive(false);

    // Clear all intervals and timeouts
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    setIsUpdating(false);
    setTimeUntilNextUpdate(updateInterval);
  }, [updateInterval]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setTimeUntilNextUpdate(updateInterval);
    setLastUpdateTime(Date.now());
  }, [updateInterval]);

  // Handle visibility change for performance optimization
  useEffect(() => {
    if (!pauseOnHidden) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (document.hidden) {
        // Tab is hidden, pause updates but keep timer running
        console.log('Tab hidden, pausing real-time updates');
      } else {
        // Tab is visible again, resume updates and force refresh
        console.log('Tab visible, resuming real-time updates');
        if (isActive) {
          debouncedUpdate();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pauseOnHidden, isActive, debouncedUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Auto-start if freshness updates are active
  useEffect(() => {
    if (isAutoUpdateActive && !isActive) {
      start();
    } else if (!isAutoUpdateActive && isActive) {
      stop();
    }
  }, [isAutoUpdateActive, isActive, start, stop]);

  // Sync with freshness hook's last update time
  useEffect(() => {
    if (freshnessLastUpdate > lastUpdateTime) {
      setLastUpdateTime(freshnessLastUpdate);
      resetTimer();
    }
  }, [freshnessLastUpdate, lastUpdateTime, resetTimer]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const metrics = performanceMetricsRef.current;
    if (metrics.length === 0) {
      return {
        averageDuration: 0,
        averageUpdateCount: 0,
        totalUpdates: 0,
        lastUpdateDuration: 0,
      };
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalCount = metrics.reduce((sum, m) => sum + m.count, 0);
    
    return {
      averageDuration: totalDuration / metrics.length,
      averageUpdateCount: totalCount / metrics.length,
      totalUpdates: metrics.length,
      lastUpdateDuration: metrics[metrics.length - 1]?.duration || 0,
    };
  }, []);

  return {
    isActive,
    isUpdating,
    lastUpdateCount,
    lastUpdateTime,
    timeUntilNextUpdate,
    start,
    stop,
    forceUpdate,
    resetTimer,
    getPerformanceMetrics,
  };
}