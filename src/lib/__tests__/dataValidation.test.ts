import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  validateTask,
  validateTaskArray,
  sanitizeTaskInput,
  recoverTask,
  recoverTaskArray,
  validateAndRecoverLocalStorage,
  classifyError,
} from '../dataValidation';
import type { Task, CreateTaskInput } from '../../types';

describe('Data Validation', () => {
  describe('validateCreateTaskInput', () => {
    it('validates valid task input', () => {
      const validInput: CreateTaskInput = {
        title: 'Test Task',
        description: 'Test description',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      };

      expect(() => validateCreateTaskInput(validInput)).not.toThrow();
      const result = validateCreateTaskInput(validInput);
      expect(result.title).toBe('Test Task');
      expect(result.priority).toBe('medium');
    });

    it('throws error for invalid input', () => {
      const invalidInput = {
        title: '', // Empty title
        dueDate: 'invalid-date',
        priority: 'invalid-priority',
      };

      expect(() => validateCreateTaskInput(invalidInput)).toThrow('入力データが無効です');
    });

    it('trims whitespace from title', () => {
      const input = {
        title: '  Test Task  ',
        dueDate: new Date('2024-12-31'),
        priority: 'medium' as const,
      };

      const result = validateCreateTaskInput(input);
      expect(result.title).toBe('Test Task');
    });

    it('sets default priority when not provided', () => {
      const input = {
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
      };

      const result = validateCreateTaskInput(input);
      expect(result.priority).toBe('medium');
    });
  });

  describe('validateTask', () => {
    it('validates complete task object', () => {
      const validTask: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test description',
        dueDate: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01'),
        priority: 'high',
        completed: false,
        freshnessState: '新規',
      };

      expect(() => validateTask(validTask)).not.toThrow();
      const result = validateTask(validTask);
      expect(result.id).toBe('task-1');
    });

    it('throws error for missing required fields', () => {
      const invalidTask = {
        title: 'Test Task',
        // Missing required fields
      };

      expect(() => validateTask(invalidTask)).toThrow('タスクデータが無効です');
    });
  });

  describe('sanitizeTaskInput', () => {
    it('sanitizes and trims input data', () => {
      const input = {
        title: '  Very long title that exceeds the maximum length limit and should be truncated to fit within the allowed character count  '.repeat(10),
        description: '  Test description  ',
        priority: 'high' as const,
      };

      const result = sanitizeTaskInput(input);
      expect(result.title?.length).toBeLessThanOrEqual(200);
      expect(result.description).toBe('Test description');
    });

    it('handles invalid date strings', () => {
      const input = {
        title: 'Test Task',
        dueDate: 'invalid-date' as any,
      };

      const result = sanitizeTaskInput(input);
      expect(result.dueDate).toBeUndefined();
    });

    it('converts valid date strings to Date objects', () => {
      const input = {
        title: 'Test Task',
        dueDate: '2024-12-31T10:00:00Z' as any,
      };

      const result = sanitizeTaskInput(input);
      expect(result.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('recoverTask', () => {
    it('recovers valid corrupted task', () => {
      const corruptedTask = {
        id: 'task-1',
        title: 'Test Task',
        dueDate: '2024-12-31T10:00:00Z',
        createdAt: '2024-01-01T10:00:00Z',
        priority: 'high',
        completed: false,
        freshnessState: '新規',
      };

      const result = recoverTask(corruptedTask);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('task-1');
      expect(result?.dueDate).toBeInstanceOf(Date);
    });

    it('returns null for unrecoverable task', () => {
      const corruptedTask = {
        // Missing ID - cannot recover
        title: 'Test Task',
      };

      const result = recoverTask(corruptedTask);
      expect(result).toBeNull();
    });

    it('provides default values for missing fields', () => {
      const corruptedTask = {
        id: 'task-1',
        // Missing title and other fields
      };

      const result = recoverTask(corruptedTask);
      expect(result?.title).toBe('復旧されたタスク');
      expect(result?.priority).toBe('medium');
      expect(result?.freshnessState).toBe('新規');
    });
  });

  describe('recoverTaskArray', () => {
    it('recovers array of tasks', () => {
      const corruptedTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          dueDate: '2024-12-31T10:00:00Z',
          createdAt: '2024-01-01T10:00:00Z',
          priority: 'high',
          completed: false,
          freshnessState: '新規',
        },
        {
          id: 'task-2',
          title: 'Task 2',
          // Some fields missing but recoverable
        },
        {
          // Unrecoverable task (no ID)
          title: 'Task 3',
        },
      ];

      const result = recoverTaskArray(corruptedTasks);
      expect(result).toHaveLength(2); // Only 2 recoverable tasks
      expect(result[0].id).toBe('task-1');
      expect(result[1].id).toBe('task-2');
    });

    it('returns empty array for non-array input', () => {
      const result = recoverTaskArray('not-an-array');
      expect(result).toEqual([]);
    });
  });

  describe('validateAndRecoverLocalStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns null for non-existent key', () => {
      const result = validateAndRecoverLocalStorage('non-existent-key');
      expect(result).toBeNull();
    });

    it('recovers valid Zustand persist format', () => {
      const validData = {
        state: {
          tasks: [
            {
              id: 'task-1',
              title: 'Test Task',
              dueDate: '2024-12-31T10:00:00Z',
              createdAt: '2024-01-01T10:00:00Z',
              priority: 'high',
              completed: false,
              freshnessState: '新規',
            },
          ],
        },
        version: 0,
      };

      localStorage.setItem('test-key', JSON.stringify(validData));
      const result = validateAndRecoverLocalStorage('test-key');
      
      expect(result).not.toBeNull();
      expect(result.state.tasks).toHaveLength(1);
      expect(result.state.tasks[0].dueDate).toBeInstanceOf(Date);
    });

    it('handles corrupted data by clearing storage', () => {
      localStorage.setItem('test-key', 'invalid-json{');
      
      const result = validateAndRecoverLocalStorage('test-key');
      expect(result).toBeNull();
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('classifyError', () => {
    it('classifies validation errors', () => {
      const error = new Error('Validation failed: required field missing');
      const result = classifyError(error);
      
      expect(result.type).toBe('validation');
      expect(result.severity).toBe('medium');
      expect(result.recoverable).toBe(true);
    });

    it('classifies network errors', () => {
      const error = new Error('Network connection failed');
      const result = classifyError(error);
      
      expect(result.type).toBe('network');
      expect(result.severity).toBe('high');
      expect(result.recoverable).toBe(true);
    });

    it('classifies storage errors', () => {
      const error = new Error('LocalStorage quota exceeded');
      const result = classifyError(error);
      
      expect(result.type).toBe('storage');
      expect(result.severity).toBe('high');
      expect(result.recoverable).toBe(true);
    });

    it('classifies animation errors', () => {
      const error = new Error('CSS animation failed to start');
      const result = classifyError(error);
      
      expect(result.type).toBe('animation');
      expect(result.severity).toBe('low');
      expect(result.recoverable).toBe(true);
    });

    it('classifies unknown errors', () => {
      const error = new Error('Some unknown error');
      const result = classifyError(error);
      
      expect(result.type).toBe('unknown');
      expect(result.severity).toBe('medium');
      expect(result.recoverable).toBe(false);
    });
  });
});