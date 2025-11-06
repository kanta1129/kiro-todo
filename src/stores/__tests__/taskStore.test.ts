import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore, startFreshnessUpdates, stopFreshnessUpdates } from '../taskStore';
import type { CreateTaskInput, UpdateTaskInput } from '../../types';

// Mock the freshness calculation functions
vi.mock('../../lib/freshness', () => ({
  calculateFreshness: vi.fn(() => ({ state: '新規', shouldUpdate: false })),
  calculateFreshnessForTasks: vi.fn(() => new Map()),
}));

describe('TaskStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useTaskStore.setState({
      tasks: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
    
    // Clear localStorage mock
    localStorage.clear();
  });

  describe('Task Creation', () => {
    it('should add a new task with correct properties', () => {
      const store = useTaskStore.getState();
      const taskInput: CreateTaskInput = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      };

      store.addTask(taskInput);

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      
      const createdTask = state.tasks[0];
      expect(createdTask.title).toBe(taskInput.title);
      expect(createdTask.description).toBe(taskInput.description);
      expect(createdTask.dueDate).toEqual(taskInput.dueDate);
      expect(createdTask.priority).toBe(taskInput.priority);
      expect(createdTask.completed).toBe(false);
      expect(createdTask.freshnessState).toBe('新規');
      expect(createdTask.id).toBeDefined();
      expect(createdTask.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for multiple tasks', () => {
      const store = useTaskStore.getState();
      const taskInput: CreateTaskInput = {
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      };

      store.addTask(taskInput);
      store.addTask({ ...taskInput, title: 'Test Task 2' });

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(2);
      expect(state.tasks[0].id).not.toBe(state.tasks[1].id);
    });

    it('should update lastUpdated when adding a task', () => {
      const store = useTaskStore.getState();
      const beforeTime = new Date();
      
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      const state = useTaskStore.getState();
      expect(state.lastUpdated).toBeInstanceOf(Date);
      expect(state.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('Task Editing', () => {
    it('should update task properties correctly', () => {
      const store = useTaskStore.getState();
      
      // Add a task first
      store.addTask({
        title: 'Original Title',
        description: 'Original Description',
        dueDate: new Date('2024-12-31'),
        priority: 'low',
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      const updates: UpdateTaskInput = {
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'high',
      };

      store.updateTask(taskId, updates);

      const state = useTaskStore.getState();
      const updatedTask = state.tasks[0];
      expect(updatedTask.title).toBe(updates.title);
      expect(updatedTask.description).toBe(updates.description);
      expect(updatedTask.priority).toBe(updates.priority);
      expect(state.error).toBeNull();
    });

    it('should handle updating non-existent task', () => {
      const store = useTaskStore.getState();
      const nonExistentId = 'non-existent-id';

      store.updateTask(nonExistentId, { title: 'Updated Title' });

      const state = useTaskStore.getState();
      expect(state.error).toBe(`Task with id ${nonExistentId} not found`);
    });

    it('should update lastUpdated when editing a task', () => {
      const store = useTaskStore.getState();
      
      // Add a task first
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      const beforeTime = new Date();
      
      store.updateTask(taskId, { title: 'Updated Title' });

      const state = useTaskStore.getState();
      expect(state.lastUpdated).toBeInstanceOf(Date);
      expect(state.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('Task Deletion', () => {
    it('should remove task from the list', () => {
      const store = useTaskStore.getState();
      
      // Add two tasks
      store.addTask({
        title: 'Task 1',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });
      store.addTask({
        title: 'Task 2',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      store.deleteTask(taskId);

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('Task 2');
      expect(state.error).toBeNull();
    });

    it('should handle deleting non-existent task', () => {
      const store = useTaskStore.getState();
      const nonExistentId = 'non-existent-id';

      store.deleteTask(nonExistentId);

      const state = useTaskStore.getState();
      expect(state.error).toBe(`Task with id ${nonExistentId} not found`);
    });

    it('should update lastUpdated when deleting a task', () => {
      const store = useTaskStore.getState();
      
      // Add a task first
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      const beforeTime = new Date();
      
      store.deleteTask(taskId);

      const state = useTaskStore.getState();
      expect(state.lastUpdated).toBeInstanceOf(Date);
      expect(state.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('Task Completion', () => {
    it('should mark task as completed', () => {
      const store = useTaskStore.getState();
      
      // Add a task first
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      store.completeTask(taskId);

      const state = useTaskStore.getState();
      expect(state.tasks[0].completed).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle completing non-existent task', () => {
      const store = useTaskStore.getState();
      const nonExistentId = 'non-existent-id';

      store.completeTask(nonExistentId);

      const state = useTaskStore.getState();
      expect(state.error).toBe(`Task with id ${nonExistentId} not found`);
    });

    it('should update lastUpdated when completing a task', () => {
      const store = useTaskStore.getState();
      
      // Add a task first
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      const beforeTime = new Date();
      
      store.completeTask(taskId);

      const state = useTaskStore.getState();
      expect(state.lastUpdated).toBeInstanceOf(Date);
      expect(state.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('Freshness State Updates', () => {
    it('should call updateFreshnessStates without errors', () => {
      const store = useTaskStore.getState();
      
      // Add a task first
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      expect(() => store.updateFreshnessStates()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors correctly', () => {
      const store = useTaskStore.getState();
      
      store.setError('Test error');
      expect(useTaskStore.getState().error).toBe('Test error');
      
      store.clearError();
      expect(useTaskStore.getState().error).toBeNull();
    });

    it('should set loading state correctly', () => {
      const store = useTaskStore.getState();
      
      store.setLoading(true);
      expect(useTaskStore.getState().isLoading).toBe(true);
      
      store.setLoading(false);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });
  });

  describe('Local Storage Integration', () => {
    it('should persist tasks to localStorage when adding', () => {
      const store = useTaskStore.getState();
      
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      // Check that localStorage.setItem was called
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should persist tasks to localStorage when updating', () => {
      const store = useTaskStore.getState();
      
      // Add a task first
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      // Clear the mock to check only the update call
      vi.clearAllMocks();

      const taskId = useTaskStore.getState().tasks[0].id;
      store.updateTask(taskId, { title: 'Updated Title' });

      // Check that localStorage.setItem was called for the update
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should persist tasks to localStorage when deleting', () => {
      const store = useTaskStore.getState();
      
      // Add a task first
      store.addTask({
        title: 'Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      // Clear the mock to check only the delete call
      vi.clearAllMocks();

      const taskId = useTaskStore.getState().tasks[0].id;
      store.deleteTask(taskId);

      // Check that localStorage.setItem was called for the delete
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Freshness Update Interval', () => {
    it('should start and stop freshness updates', () => {
      // Mock setInterval and clearInterval
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      startFreshnessUpdates(1000);
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      stopFreshnessUpdates();
      expect(clearIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });
});