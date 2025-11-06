import type { Task, CreateTaskInput, UpdateTaskInput } from './task';
import type { FreshnessState, VisualTheme } from './freshness';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// TaskItem component props
export interface TaskItemProps extends BaseComponentProps {
  task: Task;
  onEdit?: (id: string, updates: UpdateTaskInput) => void;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReveal?: (id: string) => void; // For tombstone mode
  isRevealed?: boolean;
}

// TaskList component props
export interface TaskListProps extends BaseComponentProps {
  tasks: Task[];
  onTaskEdit?: (id: string, updates: UpdateTaskInput) => void;
  onTaskComplete?: (id: string) => void;
  onTaskDelete?: (id: string) => void;
  showCompleted?: boolean;
  sortBy?: 'dueDate' | 'freshness' | 'priority' | 'createdAt';
  filterBy?: {
    priority?: Task['priority'][];
    freshnessState?: FreshnessState[];
  };
}

// TaskForm component props
export interface TaskFormProps extends BaseComponentProps {
  onSubmit: (task: CreateTaskInput) => void;
  onCancel?: () => void;
  initialValues?: Partial<CreateTaskInput>;
  isEditing?: boolean;
  isLoading?: boolean;
}

// VisualEffects component props
export interface VisualEffectsProps extends BaseComponentProps {
  freshnessState: FreshnessState;
  theme: VisualTheme;
  isAnimating?: boolean;
  intensity?: number; // 0-1 for effect intensity
}

// Error boundary props
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

// Hook return types
export interface UseTasksReturn {
  tasks: Task[];
  addTask: (task: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseFreshnessReturn {
  calculateTaskFreshness: (task: Task) => import('./freshness').FreshnessCalculationResult;
  calculateAllFreshness: () => Map<string, import('./freshness').FreshnessCalculationResult>;
  updateFreshnessStates: () => number | undefined;
  startFreshnessUpdates: () => void;
  stopFreshnessUpdates: () => void;
  forceFreshnessUpdate: () => number | undefined;
  hasPendingUpdates: () => boolean;
  getTimeUntilNextUpdate: () => number;
  isAutoUpdateActive: boolean;
  lastUpdateTime: number;
}

// Real-time updates hook return type
export interface UseRealTimeUpdatesReturn {
  isActive: boolean;
  isUpdating: boolean;
  lastUpdateCount: number;
  lastUpdateTime: number;
  timeUntilNextUpdate: number;
  start: () => void;
  stop: () => void;
  forceUpdate: () => Promise<number>;
  resetTimer: () => void;
  getPerformanceMetrics: () => {
    averageDuration: number;
    averageUpdateCount: number;
    totalUpdates: number;
    lastUpdateDuration: number;
  };
}

// Background task statistics
export interface BackgroundTaskStats {
  totalCycles: number;
  totalTasksUpdated: number;
  consecutiveErrors: number;
  lastSuccessfulUpdate: number;
  lastError: number | null;
  averageUpdateInterval: number;
  isRunning: boolean;
  isPaused: boolean;
}

// Form field types
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface TextInputProps extends FormFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export interface DateInputProps extends FormFieldProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

export interface SelectInputProps extends FormFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// Animation and transition types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface TransitionProps {
  in: boolean;
  timeout: number;
  onEnter?: () => void;
  onExit?: () => void;
}

// Store types
export interface TaskStoreState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface TaskStoreActions {
  addTask: (task: CreateTaskInput) => void;
  updateTask: (id: string, updates: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  updateFreshnessStates: () => void;
  updateFreshnessStatesEnhanced: () => Promise<number>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type TaskStore = TaskStoreState & TaskStoreActions;