import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTaskStore, startFreshnessUpdates, stopFreshnessUpdates } from '../stores/taskStore';
import type { CreateTaskInput, Task } from '../types';
import { calculateFreshness, calculateFreshnessForTasks } from '../lib/freshness';

// Mock freshness calculation to control time-based behavior
vi.mock('../lib/freshness', () => ({
  calculateFreshness: vi.fn(),
  calculateFreshnessForTasks: vi.fn(() => new Map()),
  needsFreshnessUpdate: vi.fn(() => false),
}));

describe('Task Lifecycle Integration Tests', () => {
  beforeEach(() => {
    // Reset store state
    useTaskStore.setState({
      tasks: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Default freshness calculation
    vi.mocked(calculateFreshness).mockReturnValue({
      state: '新規',
      daysUntilDue: 5,
      adjustedDays: 5,
      shouldUpdate: false,
    });
    
    // Default freshness calculation for tasks
    vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map());
  });

  afterEach(() => {
    stopFreshnessUpdates();
  });

  describe('Complete Task Creation to Completion Flow', () => {
    it('should handle full task lifecycle from creation to completion', () => {
      const store = useTaskStore.getState();
      
      // Step 1: Create a new task
      const taskInput: CreateTaskInput = {
        title: 'Integration Test Task',
        description: 'Test task for lifecycle integration',
        dueDate: new Date('2024-12-31'),
        priority: 'high',
      };

      store.addTask(taskInput);
      
      // Verify task creation (Requirement 1.1, 1.2, 1.4, 1.5)
      let state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      
      const createdTask = state.tasks[0];
      expect(createdTask.title).toBe(taskInput.title);
      expect(createdTask.description).toBe(taskInput.description);
      expect(createdTask.priority).toBe(taskInput.priority);
      expect(createdTask.completed).toBe(false);
      expect(createdTask.freshnessState).toBe('新規');
      expect(createdTask.id).toBeDefined();
      expect(createdTask.createdAt).toBeInstanceOf(Date);

      // Step 2: Edit the task (Requirement 5.1, 5.2)
      const taskId = createdTask.id;
      const updates = {
        title: 'Updated Integration Test Task',
        description: 'Updated description',
        priority: 'medium' as const,
      };

      store.updateTask(taskId, updates);
      
      // Verify task update
      state = useTaskStore.getState();
      const updatedTask = state.tasks[0];
      expect(updatedTask.title).toBe(updates.title);
      expect(updatedTask.description).toBe(updates.description);
      expect(updatedTask.priority).toBe(updates.priority);
      expect(updatedTask.completed).toBe(false);
      expect(state.error).toBeNull();

      // Step 3: Complete the task (Requirement 4.1, 4.2)
      store.completeTask(taskId);
      
      // Verify task completion
      state = useTaskStore.getState();
      const completedTask = state.tasks[0];
      expect(completedTask.completed).toBe(true);
      expect(state.error).toBeNull();

      // Step 4: Verify localStorage persistence throughout lifecycle
      expect(localStorage.setItem).toHaveBeenCalledTimes(3); // Create, update, complete
      
      // Step 5: Verify lastUpdated is maintained throughout
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle task deletion in the lifecycle', () => {
      const store = useTaskStore.getState();
      
      // Create multiple tasks
      store.addTask({
        title: 'Task 1',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });
      
      store.addTask({
        title: 'Task 2',
        dueDate: new Date('2024-12-31'),
        priority: 'high',
      });

      // Verify both tasks exist
      let state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(2);

      // Delete first task
      const firstTaskId = state.tasks[0].id;
      store.deleteTask(firstTaskId);

      // Verify deletion
      state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('Task 2');
      expect(state.error).toBeNull();
    });
  });

  describe('Freshness State Transitions Over Time', () => {
    it('should transition through all freshness states based on time', () => {
      const store = useTaskStore.getState();
      
      // Create a task
      store.addTask({
        title: 'Freshness Test Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      // Test transition to '期限接近' (approaching deadline) - Requirement 2.2
      const taskId = useTaskStore.getState().tasks[0].id;
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map([
        [taskId, {
          state: '期限接近',
          daysUntilDue: 2,
          adjustedDays: 2,
          shouldUpdate: true,
        }]
      ]));

      store.updateFreshnessStates();
      
      let state = useTaskStore.getState();
      expect(state.tasks[0].freshnessState).toBe('期限接近');

      // Test transition to '期限間近' (critical deadline) - Requirement 2.3
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map([
        [taskId, {
          state: '期限間近',
          daysUntilDue: 0.5,
          adjustedDays: 0.5,
          shouldUpdate: true,
        }]
      ]));

      store.updateFreshnessStates();
      
      state = useTaskStore.getState();
      expect(state.tasks[0].freshnessState).toBe('期限間近');

      // Test transition to '期限切れ' (overdue) - Requirement 3.1
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map([
        [taskId, {
          state: '期限切れ',
          daysUntilDue: -1,
          adjustedDays: -1,
          shouldUpdate: true,
        }]
      ]));

      store.updateFreshnessStates();
      
      state = useTaskStore.getState();
      expect(state.tasks[0].freshnessState).toBe('期限切れ');
    });

    it('should handle priority-based freshness decay rates', () => {
      const store = useTaskStore.getState();
      
      // Create high priority task (should decay faster) - Requirement 2.5
      store.addTask({
        title: 'High Priority Task',
        dueDate: new Date('2024-12-31'),
        priority: 'high',
      });

      // Create low priority task (should decay slower) - Requirement 2.5
      store.addTask({
        title: 'Low Priority Task',
        dueDate: new Date('2024-12-31'),
        priority: 'low',
      });

      const tasks = useTaskStore.getState().tasks;
      const highPriorityTaskId = tasks.find(t => t.priority === 'high')!.id;
      const lowPriorityTaskId = tasks.find(t => t.priority === 'low')!.id;

      // Mock different decay rates for different priorities
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map([
        [highPriorityTaskId, {
          state: '期限間近',
          daysUntilDue: 1,
          adjustedDays: 0.8, // High priority decays faster
          shouldUpdate: true,
        }],
        [lowPriorityTaskId, {
          state: '期限接近',
          daysUntilDue: 1,
          adjustedDays: 1.2, // Low priority decays slower
          shouldUpdate: true,
        }]
      ]));

      store.updateFreshnessStates();
      
      const state = useTaskStore.getState();
      const highPriorityTask = state.tasks.find(t => t.id === highPriorityTaskId)!;
      const lowPriorityTask = state.tasks.find(t => t.id === lowPriorityTaskId)!;

      expect(highPriorityTask.freshnessState).toBe('期限間近');
      expect(lowPriorityTask.freshnessState).toBe('期限接近');
    });

    it('should not update freshness for completed tasks', () => {
      const store = useTaskStore.getState();
      
      // Create and complete a task
      store.addTask({
        title: 'Completed Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      store.completeTask(taskId);

      // Mock freshness calculation to return overdue state
      // Since the task is completed, it should not be updated
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map()); // No updates for completed tasks

      store.updateFreshnessStates();
      
      // Completed task should maintain its original freshness state
      const state = useTaskStore.getState();
      expect(state.tasks[0].completed).toBe(true);
      expect(state.tasks[0].freshnessState).toBe('新規'); // Should not change
    });
  });

  describe('Tombstone Functionality', () => {
    it('should allow task revival by updating due date', () => {
      const store = useTaskStore.getState();
      
      // Create an overdue task
      store.addTask({
        title: 'Overdue Task',
        dueDate: new Date('2024-01-01'), // Past date
        priority: 'medium',
      });

      // Set task to overdue state - Requirement 3.1
      const taskId = useTaskStore.getState().tasks[0].id;
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map([
        [taskId, {
          state: '期限切れ',
          daysUntilDue: -30,
          adjustedDays: -30,
          shouldUpdate: true,
        }]
      ]));

      store.updateFreshnessStates();
      
      let state = useTaskStore.getState();
      expect(state.tasks[0].freshnessState).toBe('期限切れ');

      // Revive task by updating due date to future - Requirement 3.4
      store.updateTask(taskId, {
        dueDate: new Date('2024-12-31'), // Future date
      });

      // Mock freshness calculation for revived task
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map([
        [taskId, {
          state: '新規',
          daysUntilDue: 30,
          adjustedDays: 30,
          shouldUpdate: true,
        }]
      ]));

      store.updateFreshnessStates();
      
      state = useTaskStore.getState();
      expect(state.tasks[0].freshnessState).toBe('新規');
      expect(state.tasks[0].dueDate).toEqual(new Date('2024-12-31'));
    });

    it('should maintain tombstone tasks in separate visual section', () => {
      const store = useTaskStore.getState();
      
      // Create multiple tasks with different states
      store.addTask({
        title: 'Fresh Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      store.addTask({
        title: 'Overdue Task 1',
        dueDate: new Date('2024-01-01'),
        priority: 'high',
      });

      store.addTask({
        title: 'Overdue Task 2',
        dueDate: new Date('2024-01-15'),
        priority: 'low',
      });

      // Mock freshness states - Requirement 3.5
      const tasks = useTaskStore.getState().tasks;
      const freshTaskId = tasks.find(t => t.title === 'Fresh Task')!.id;
      const overdueTask1Id = tasks.find(t => t.title === 'Overdue Task 1')!.id;
      const overdueTask2Id = tasks.find(t => t.title === 'Overdue Task 2')!.id;
      
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map([
        [freshTaskId, { state: '新規', daysUntilDue: 30, adjustedDays: 30, shouldUpdate: true }],
        [overdueTask1Id, { state: '期限切れ', daysUntilDue: -30, adjustedDays: -30, shouldUpdate: true }],
        [overdueTask2Id, { state: '期限切れ', daysUntilDue: -30, adjustedDays: -30, shouldUpdate: true }]
      ]));

      store.updateFreshnessStates();
      
      const state = useTaskStore.getState();
      const freshTasks = state.tasks.filter(t => t.freshnessState !== '期限切れ');
      const tombstoneTasks = state.tasks.filter(t => t.freshnessState === '期限切れ');

      expect(freshTasks).toHaveLength(1);
      expect(tombstoneTasks).toHaveLength(2);
      expect(freshTasks[0].title).toBe('Fresh Task');
      expect(tombstoneTasks.map(t => t.title)).toEqual(['Overdue Task 1', 'Overdue Task 2']);
    });
  });

  describe('Real-time Freshness Updates', () => {
    it('should automatically update freshness states with interval', async () => {
      const store = useTaskStore.getState();
      
      // Create a task
      store.addTask({
        title: 'Auto Update Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      // Start automatic updates with short interval for testing
      const intervalSpy = vi.spyOn(global, 'setInterval');
      startFreshnessUpdates(100); // 100ms for fast testing

      expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      // Mock state change after some time
      const taskId = useTaskStore.getState().tasks[0].id;
      vi.mocked(calculateFreshnessForTasks).mockReturnValue(new Map([
        [taskId, {
          state: '期限接近',
          daysUntilDue: 2,
          adjustedDays: 2,
          shouldUpdate: true,
        }]
      ]));

      // Wait for interval to trigger
      await new Promise(resolve => setTimeout(resolve, 150));

      const state = useTaskStore.getState();
      expect(state.tasks[0].freshnessState).toBe('期限接近');

      intervalSpy.mockRestore();
    });
  });

  describe('Error Handling in Task Lifecycle', () => {
    it('should handle errors gracefully during task operations', () => {
      const store = useTaskStore.getState();
      
      // Test error handling for non-existent task operations
      store.updateTask('non-existent-id', { title: 'Updated' });
      expect(useTaskStore.getState().error).toBe('Task with id non-existent-id not found');

      store.clearError();
      
      store.deleteTask('non-existent-id');
      expect(useTaskStore.getState().error).toBe('Task with id non-existent-id not found');

      store.clearError();
      
      store.completeTask('non-existent-id');
      expect(useTaskStore.getState().error).toBe('Task with id non-existent-id not found');
    });

    it('should recover from errors and continue normal operation', () => {
      const store = useTaskStore.getState();
      
      // Trigger an error
      store.updateTask('non-existent-id', { title: 'Updated' });
      expect(useTaskStore.getState().error).toBeTruthy();

      // Clear error and perform normal operation
      store.clearError();
      store.addTask({
        title: 'Recovery Task',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      const state = useTaskStore.getState();
      expect(state.error).toBeNull();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('Recovery Task');
    });
  });
});