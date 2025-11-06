// Core type definitions and interfaces
export * from './task';
export * from './freshness';
export * from './components';
export * from './utils';

// Re-export commonly used types for convenience
export type {
  Task,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
} from './task';

export type {
  FreshnessState,
  VisualTheme,
  FreshnessVisualConfig,
  FreshnessCalculationResult,
} from './freshness';

export type {
  TaskItemProps,
  TaskListProps,
  TaskFormProps,
  TaskStore,
  UseTasksReturn,
  UseFreshnessReturn,
} from './components';

export type {
  ID,
  LoadingState,
  EventHandler,
  ChangeHandler,
  SubmitHandler,
  SortDirection,
  SortConfig,
  FilterConfig,
} from './utils';