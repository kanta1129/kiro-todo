import type { 
  Task, 
  TaskPriority, 
  FreshnessState, 
  FreshnessCalculationResult,
  PriorityMultiplier 
} from '../types';
import { getDaysUntilDue } from './utils';
import { memoize } from './performance';

// Priority multipliers affect how quickly tasks decay
const PRIORITY_MULTIPLIERS: PriorityMultiplier = {
  high: 0.8,    // High priority tasks decay faster (more urgent)
  medium: 1.0,  // Normal decay rate
  low: 1.2      // Low priority tasks decay slower
};

// Freshness state thresholds (in days)
const FRESHNESS_THRESHOLDS = {
  OVERDUE: 0,      // < 0 days = 期限切れ
  CRITICAL: 1,     // 0-1 days = 期限間近  
  WARNING: 3,      // 1-3 days = 期限接近
  FRESH: Infinity  // 3+ days = 新規
};

/**
 * Calculate the freshness state of a task based on due date and priority
 * Requirements: 2.1, 2.2, 2.3, 2.5
 * Optimized with memoization for performance
 */
const calculateFreshnessCore = (task: Task): FreshnessCalculationResult => {
  const daysUntilDue = getDaysUntilDue(task.dueDate);
  const priorityMultiplier = PRIORITY_MULTIPLIERS[task.priority];
  
  // Apply priority-based decay rate
  const adjustedDays = daysUntilDue * priorityMultiplier;
  
  // Determine freshness state based on adjusted days
  let state: FreshnessState;
  
  if (adjustedDays < FRESHNESS_THRESHOLDS.OVERDUE) {
    state = '期限切れ'; // Overdue - tombstone mode
  } else if (adjustedDays <= FRESHNESS_THRESHOLDS.CRITICAL) {
    state = '期限間近'; // Critical - decay effects, mold appearance
  } else if (adjustedDays <= FRESHNESS_THRESHOLDS.WARNING) {
    state = '期限接近'; // Warning - reduced saturation, browning
  } else {
    state = '新規'; // Fresh - vibrant appearance
  }
  
  // Check if state has changed from current state
  const shouldUpdate = task.freshnessState !== state;
  
  return {
    state,
    daysUntilDue,
    adjustedDays,
    shouldUpdate
  };
};

// Memoized version for performance optimization
export const calculateFreshness = memoize(
  calculateFreshnessCore,
  (task: Task) => `${task.id}-${task.dueDate.getTime()}-${task.priority}-${task.freshnessState}`
);

/**
 * Calculate freshness for multiple tasks
 * Optimized with batch processing for performance
 */
export function calculateFreshnessForTasks(tasks: Task[]): Map<string, FreshnessCalculationResult> {
  const results = new Map<string, FreshnessCalculationResult>();
  
  // Filter active tasks first for better performance
  const activeTasks = tasks.filter(task => !task.completed);
  
  // Batch process tasks for better performance
  const batchSize = 50;
  for (let i = 0; i < activeTasks.length; i += batchSize) {
    const batch = activeTasks.slice(i, i + batchSize);
    
    batch.forEach(task => {
      results.set(task.id, calculateFreshness(task));
    });
  }
  
  return results;
}

/**
 * Get priority multiplier for a given priority level
 */
export function getPriorityMultiplier(priority: TaskPriority): number {
  return PRIORITY_MULTIPLIERS[priority];
}

/**
 * Check if a task needs freshness state update
 */
export function needsFreshnessUpdate(task: Task): boolean {
  const result = calculateFreshness(task);
  return result.shouldUpdate;
}

/**
 * Get freshness state transition direction
 */
export function getFreshnessTransition(
  currentState: FreshnessState, 
  newState: FreshnessState
): 'improving' | 'degrading' | 'stable' {
  const stateOrder: FreshnessState[] = ['新規', '期限接近', '期限間近', '期限切れ'];
  const currentIndex = stateOrder.indexOf(currentState);
  const newIndex = stateOrder.indexOf(newState);
  
  if (currentIndex < newIndex) return 'degrading';
  if (currentIndex > newIndex) return 'improving';
  return 'stable';
}