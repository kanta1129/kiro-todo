import { z } from 'zod';
import type { FreshnessState } from './freshness';

// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high';

// Core Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  createdAt: Date;
  priority: TaskPriority;
  completed: boolean;
  freshnessState: FreshnessState;
}

// Task creation input (without auto-generated fields)
export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate: Date;
  priority: TaskPriority;
}

// Task update input (partial fields)
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  completed?: boolean;
}

// Zod schemas for validation
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const CreateTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  dueDate: z.date().min(new Date(), 'Due date must be in the future'),
  priority: TaskPrioritySchema,
});

export const UpdateTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  dueDate: z.date().optional(),
  priority: TaskPrioritySchema.optional(),
  completed: z.boolean().optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.date(),
  createdAt: z.date(),
  priority: TaskPrioritySchema,
  completed: z.boolean(),
  freshnessState: z.enum(['新規', '期限接近', '期限間近', '期限切れ']),
});