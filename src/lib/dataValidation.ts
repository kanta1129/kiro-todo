import { z } from 'zod';
import type { Task, CreateTaskInput, UpdateTaskInput, FreshnessState } from '../types';

/**
 * Data validation and recovery mechanisms
 * Requirements: All requirements need proper error handling
 */

// Zod schemas for data validation
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const FreshnessStateSchema = z.enum(['新規', '期限接近', '期限間近', '期限切れ']);

export const CreateTaskInputSchema = z.object({
  title: z.string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください')
    .trim(),
  description: z.string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  dueDate: z.date({
    required_error: '期限日は必須です',
    invalid_type_error: '有効な日付を入力してください',
  }),
  priority: TaskPrioritySchema.default('medium'),
});

export const UpdateTaskInputSchema = CreateTaskInputSchema.partial();

export const TaskSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  dueDate: z.date(),
  createdAt: z.date(),
  priority: TaskPrioritySchema,
  completed: z.boolean(),
  freshnessState: FreshnessStateSchema,
});

export const TaskArraySchema = z.array(TaskSchema);

// Validation functions
export function validateCreateTaskInput(input: unknown): CreateTaskInput {
  try {
    return CreateTaskInputSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`入力データが無効です: ${messages.join(', ')}`);
    }
    throw new Error('入力データの検証に失敗しました');
  }
}

export function validateUpdateTaskInput(input: unknown): UpdateTaskInput {
  try {
    return UpdateTaskInputSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`更新データが無効です: ${messages.join(', ')}`);
    }
    throw new Error('更新データの検証に失敗しました');
  }
}

export function validateTask(task: unknown): Task {
  try {
    return TaskSchema.parse(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`タスクデータが無効です: ${messages.join(', ')}`);
    }
    throw new Error('タスクデータの検証に失敗しました');
  }
}

export function validateTaskArray(tasks: unknown): Task[] {
  try {
    return TaskArraySchema.parse(tasks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('タスクリストのデータが無効です');
    }
    throw new Error('タスクリストの検証に失敗しました');
  }
}

// Data recovery functions
export function sanitizeTaskInput(input: Partial<CreateTaskInput>): Partial<CreateTaskInput> {
  const sanitized: Partial<CreateTaskInput> = {};

  // Sanitize title
  if (typeof input.title === 'string') {
    sanitized.title = input.title.trim().slice(0, 200);
  }

  // Sanitize description
  if (typeof input.description === 'string') {
    sanitized.description = input.description.trim().slice(0, 1000) || undefined;
  }

  // Sanitize due date
  if (input.dueDate instanceof Date && !isNaN(input.dueDate.getTime())) {
    sanitized.dueDate = input.dueDate;
  } else if (typeof input.dueDate === 'string') {
    const parsed = new Date(input.dueDate);
    if (!isNaN(parsed.getTime())) {
      sanitized.dueDate = parsed;
    }
  }

  // Sanitize priority
  if (input.priority && ['low', 'medium', 'high'].includes(input.priority)) {
    sanitized.priority = input.priority;
  }

  return sanitized;
}

export function recoverTask(corruptedTask: any): Task | null {
  try {
    // Try to recover basic task structure
    const recovered: Partial<Task> = {};

    // Required fields
    if (typeof corruptedTask.id === 'string' && corruptedTask.id.length > 0) {
      recovered.id = corruptedTask.id;
    } else {
      return null; // Cannot recover without ID
    }

    if (typeof corruptedTask.title === 'string' && corruptedTask.title.trim().length > 0) {
      recovered.title = corruptedTask.title.trim().slice(0, 200);
    } else {
      recovered.title = '復旧されたタスク'; // Default title
    }

    // Optional description
    if (typeof corruptedTask.description === 'string') {
      recovered.description = corruptedTask.description.trim().slice(0, 1000) || undefined;
    }

    // Dates
    recovered.dueDate = recoverDate(corruptedTask.dueDate) || new Date();
    recovered.createdAt = recoverDate(corruptedTask.createdAt) || new Date();

    // Priority
    if (['low', 'medium', 'high'].includes(corruptedTask.priority)) {
      recovered.priority = corruptedTask.priority;
    } else {
      recovered.priority = 'medium';
    }

    // Boolean fields
    recovered.completed = Boolean(corruptedTask.completed);

    // Freshness state
    if (['新規', '期限接近', '期限間近', '期限切れ'].includes(corruptedTask.freshnessState)) {
      recovered.freshnessState = corruptedTask.freshnessState;
    } else {
      recovered.freshnessState = '新規';
    }

    // Validate the recovered task
    return validateTask(recovered);
  } catch (error) {
    console.error('Failed to recover task:', error);
    return null;
  }
}

function recoverDate(dateValue: any): Date | null {
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue;
  }
  
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  if (typeof dateValue === 'number' && dateValue > 0) {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return null;
}

export function recoverTaskArray(corruptedTasks: any): Task[] {
  if (!Array.isArray(corruptedTasks)) {
    console.warn('Task data is not an array, returning empty array');
    return [];
  }

  const recovered: Task[] = [];
  const failed: any[] = [];

  for (const task of corruptedTasks) {
    const recoveredTask = recoverTask(task);
    if (recoveredTask) {
      recovered.push(recoveredTask);
    } else {
      failed.push(task);
    }
  }

  if (failed.length > 0) {
    console.warn(`Failed to recover ${failed.length} tasks:`, failed);
  }

  return recovered;
}

// Local storage validation and recovery
export function validateAndRecoverLocalStorage(key: string): any {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    
    // If it's a Zustand persist format
    if (parsed.state && parsed.version !== undefined) {
      if (parsed.state.tasks) {
        // Convert date strings back to Date objects and validate
        const tasks = parsed.state.tasks.map((task: any) => ({
          ...task,
          dueDate: new Date(task.dueDate),
          createdAt: new Date(task.createdAt),
        }));

        const recoveredTasks = recoverTaskArray(tasks);
        
        return {
          ...parsed,
          state: {
            ...parsed.state,
            tasks: recoveredTasks,
          },
        };
      }
    }

    return parsed;
  } catch (error) {
    console.error(`Failed to validate local storage for key "${key}":`, error);
    
    // Try to backup corrupted data
    try {
      const corrupted = localStorage.getItem(key);
      if (corrupted) {
        localStorage.setItem(`${key}_corrupted_${Date.now()}`, corrupted);
      }
    } catch (backupError) {
      console.error('Failed to backup corrupted data:', backupError);
    }
    
    // Clear corrupted data
    localStorage.removeItem(key);
    return null;
  }
}

// Error classification
export function classifyError(error: Error): {
  type: 'validation' | 'network' | 'storage' | 'animation' | 'unknown';
  severity: 'low' | 'medium' | 'high';
  recoverable: boolean;
} {
  const message = error.message.toLowerCase();
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return { type: 'validation', severity: 'medium', recoverable: true };
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return { type: 'network', severity: 'high', recoverable: true };
  }
  
  if (message.includes('storage') || message.includes('localstorage') || message.includes('quota')) {
    return { type: 'storage', severity: 'high', recoverable: true };
  }
  
  if (message.includes('animation') || message.includes('transition') || message.includes('css')) {
    return { type: 'animation', severity: 'low', recoverable: true };
  }
  
  return { type: 'unknown', severity: 'medium', recoverable: false };
}

export default {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  validateTask,
  validateTaskArray,
  sanitizeTaskInput,
  recoverTask,
  recoverTaskArray,
  validateAndRecoverLocalStorage,
  classifyError,
};