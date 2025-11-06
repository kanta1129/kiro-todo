/**
 * Example usage of the TaskStore
 * This file demonstrates how to use the task store and its features
 * Requirements: 1.1, 1.2, 4.1, 4.4, 5.1, 5.2
 */

import { useTaskStore, startFreshnessUpdates, stopFreshnessUpdates } from './taskStore';
import type { CreateTaskInput, UpdateTaskInput } from '../types';

// Example: Basic task operations
export function exampleTaskOperations() {
  const store = useTaskStore.getState();

  // Create a new task
  const newTask: CreateTaskInput = {
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the task freshness system',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    priority: 'high',
  };

  // Add the task
  store.addTask(newTask);

  // Get all tasks
  const tasks = store.tasks;
  console.log('Current tasks:', tasks);

  // Update a task
  if (tasks.length > 0) {
    const taskId = tasks[0].id;
    const updates: UpdateTaskInput = {
      title: 'Updated: Complete project documentation',
      priority: 'medium',
    };
    store.updateTask(taskId, updates);
  }

  // Complete a task
  if (tasks.length > 0) {
    store.completeTask(tasks[0].id);
  }

  // Delete a task
  if (tasks.length > 1) {
    store.deleteTask(tasks[1].id);
  }

  // Update freshness states
  store.updateFreshnessStates();
}

// Example: Freshness management
export function exampleFreshnessManagement() {
  const store = useTaskStore.getState();

  // Create tasks with different due dates to demonstrate freshness states
  const tasks: CreateTaskInput[] = [
    {
      title: 'Fresh task',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'low',
    },
    {
      title: 'Warning task',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: 'medium',
    },
    {
      title: 'Critical task',
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      priority: 'high',
    },
    {
      title: 'Overdue task',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      priority: 'high',
    },
  ];

  // Add all tasks
  tasks.forEach(task => store.addTask(task));

  // Update freshness states
  store.updateFreshnessStates();

  // Log freshness states
  store.tasks.forEach(task => {
    console.log(`Task: ${task.title}, Freshness: ${task.freshnessState}`);
  });
}

// Example: Automatic freshness updates
export function exampleAutomaticUpdates() {
  // Start automatic freshness updates (every minute)
  startFreshnessUpdates(60000);

  // Later, stop automatic updates
  setTimeout(() => {
    stopFreshnessUpdates();
    console.log('Automatic freshness updates stopped');
  }, 5 * 60 * 1000); // Stop after 5 minutes
}

// Example: Local storage persistence
export function examplePersistence() {
  const store = useTaskStore.getState();

  // Add some tasks
  store.addTask({
    title: 'Persistent task 1',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    priority: 'medium',
  });

  store.addTask({
    title: 'Persistent task 2',
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    priority: 'low',
  });

  console.log('Tasks added and will be persisted to localStorage');
  console.log('Refresh the page to see tasks restored from localStorage');
}

// Example: Error handling
export function exampleErrorHandling() {
  const store = useTaskStore.getState();

  // Try to update a non-existent task
  store.updateTask('non-existent-id', { title: 'This will fail' });
  
  if (store.error) {
    console.log('Error occurred:', store.error);
    
    // Clear the error
    store.clearError();
    console.log('Error cleared');
  }

  // Try to delete a non-existent task
  store.deleteTask('another-non-existent-id');
  
  if (store.error) {
    console.log('Another error occurred:', store.error);
    store.clearError();
  }
}