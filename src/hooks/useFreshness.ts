import { useCallback, useEffect, useRef, useState } from 'react';
import { useTaskStore, startFreshnessUpdates, stopFreshnessUpdates } from '../stores';
import { calculateFreshness, calculateFreshnessForTasks } from '../lib/freshness';
import type { Task, UseFreshnessReturn } from '../types';

/**
 * Custom hook for freshness management
 * Handles automatic freshness updates and provides freshness calculation utilities
 * Requirements: 2.4, 5.1
 */
export function useFreshness(): UseFreshnessReturn {
  const { tasks, updateFreshnessStates } = useTaskStore();
  const [isAutoUpdateActive, setIsAutoUpdateActive] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate freshness for a single task
  const calculateTaskFreshness = useCallback((task: Task) => {
    return calculateFreshness(task);
  }, []);

  // Calculate freshness for all tasks
  const calculateAllFreshness = useCallback(() => {
    const activeTasks = tasks.filter((task: Task) => !task.completed);
    return calculateFreshnessForTasks(activeTasks);
  }, [tasks]);

  // Update freshness states and return number of updated tasks
  const updateFreshnessStatesWithCount = useCallback(() => {
    const beforeUpdate = tasks.map((task: Task) => ({ id: task.id, state: task.freshnessState }));
    updateFreshnessStates();
    
    // Count how many tasks had their freshness state updated
    const afterUpdate = useTaskStore.getState().tasks;
    let updatedCount = 0;
    
    beforeUpdate.forEach((before: { id: string; state: any }) => {
      const after = afterUpdate.find((task: Task) => task.id === before.id);
      if (after && after.freshnessState !== before.state) {
        updatedCount++;
      }
    });
    
    setLastUpdateTime(Date.now());
    return updatedCount;
  }, [tasks, updateFreshnessStates]);

  // Start automatic freshness updates
  const startFreshnessUpdatesWithState = useCallback(() => {
    if (!isAutoUpdateActive) {
      startFreshnessUpdates(60000); // Update every minute
      setIsAutoUpdateActive(true);
    }
  }, [isAutoUpdateActive]);

  // Stop automatic freshness updates
  const stopFreshnessUpdatesWithState = useCallback(() => {
    if (isAutoUpdateActive) {
      stopFreshnessUpdates();
      setIsAutoUpdateActive(false);
    }
  }, [isAutoUpdateActive]);

  // Force immediate freshness update
  const forceFreshnessUpdate = useCallback(() => {
    return updateFreshnessStatesWithCount();
  }, [updateFreshnessStatesWithCount]);

  // Check if there are pending freshness updates needed
  const hasPendingUpdates = useCallback(() => {
    const freshnessResults = calculateAllFreshness();
    return Array.from(freshnessResults.values()).some(result => result.shouldUpdate);
  }, [calculateAllFreshness]);

  // Get time until next scheduled update (in milliseconds)
  const getTimeUntilNextUpdate = useCallback(() => {
    if (!isAutoUpdateActive) return -1;
    const timeSinceLastUpdate = Date.now() - lastUpdateTime;
    const timeUntilNext = 60000 - timeSinceLastUpdate; // 60 second interval
    return Math.max(0, timeUntilNext);
  }, [isAutoUpdateActive, lastUpdateTime]);

  // Start automatic updates on mount
  useEffect(() => {
    startFreshnessUpdatesWithState();
    
    return () => {
      stopFreshnessUpdatesWithState();
    };
  }, [startFreshnessUpdatesWithState, stopFreshnessUpdatesWithState]);

  return {
    calculateTaskFreshness,
    calculateAllFreshness,
    updateFreshnessStates: updateFreshnessStatesWithCount,
    startFreshnessUpdates: startFreshnessUpdatesWithState,
    stopFreshnessUpdates: stopFreshnessUpdatesWithState,
    forceFreshnessUpdate,
    hasPendingUpdates,
    getTimeUntilNextUpdate,
    isAutoUpdateActive,
    lastUpdateTime,
  };
}