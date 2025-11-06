import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStore } from '../types';
import { calculateFreshness, calculateFreshnessForTasks } from '../lib/freshness';
import { getEnhancedFreshnessUpdater } from '../lib/enhancedFreshnessUpdater';
import { validateCreateTaskInput, validateUpdateTaskInput, validateAndRecoverLocalStorage } from '../lib/dataValidation';
import { errorRecoveryService, withSyncErrorRecovery } from '../lib/errorRecovery';

// Generate unique ID for tasks (optimized)
function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Local storage key for task persistence
const STORAGE_KEY = 'task-freshness-todo-store';

// Create the task store with Zustand
export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      // State
      tasks: [],
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Actions
      addTask: (taskInput: CreateTaskInput) => {
        return withSyncErrorRecovery(
          () => {
            // Validate input data
            const validatedInput = validateCreateTaskInput(taskInput);
            
            const now = new Date();
            const newTask: Task = {
              id: generateId(),
              title: validatedInput.title,
              description: validatedInput.description,
              dueDate: validatedInput.dueDate,
              createdAt: now,
              priority: validatedInput.priority,
              completed: false,
              freshnessState: '新規', // Initial state, will be calculated
            };

            // Calculate initial freshness state
            const freshnessResult = calculateFreshness(newTask);
            newTask.freshnessState = freshnessResult.state;

            set((state) => ({
              tasks: [...state.tasks, newTask],
              lastUpdated: now,
              error: null,
            }));
          },
          undefined,
          'TaskStore.addTask'
        );
      },

      updateTask: (id: string, updates: UpdateTaskInput) => {
        return withSyncErrorRecovery(
          () => {
            // Validate update data
            const validatedUpdates = validateUpdateTaskInput(updates);
            
            set((state) => {
              const taskIndex = state.tasks.findIndex(task => task.id === id);
              if (taskIndex === -1) {
                return {
                  ...state,
                  error: `タスク ID ${id} が見つかりません`,
                };
              }

              const updatedTasks = [...state.tasks];
              const currentTask = updatedTasks[taskIndex];
              const updatedTask = { ...currentTask, ...validatedUpdates };

              // Recalculate freshness if due date or priority changed
              if (validatedUpdates.dueDate || validatedUpdates.priority) {
                const freshnessResult = calculateFreshness(updatedTask);
                updatedTask.freshnessState = freshnessResult.state;
              }

              updatedTasks[taskIndex] = updatedTask;

              return {
                tasks: updatedTasks,
                lastUpdated: new Date(),
                error: null,
              };
            });
          },
          undefined,
          'TaskStore.updateTask'
        );
      },

      deleteTask: (id: string) => {
        set((state) => {
          const taskExists = state.tasks.some(task => task.id === id);
          if (!taskExists) {
            return {
              ...state,
              error: `Task with id ${id} not found`,
            };
          }

          return {
            tasks: state.tasks.filter(task => task.id !== id),
            lastUpdated: new Date(),
            error: null,
          };
        });
      },

      completeTask: (id: string) => {
        set((state) => {
          const taskIndex = state.tasks.findIndex(task => task.id === id);
          if (taskIndex === -1) {
            return {
              ...state,
              error: `Task with id ${id} not found`,
            };
          }

          const updatedTasks = [...state.tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            completed: true,
          };

          return {
            tasks: updatedTasks,
            lastUpdated: new Date(),
            error: null,
          };
        });
      },

      updateFreshnessStates: () => {
        set((state) => {
          const activeTasks = state.tasks.filter(task => !task.completed);
          const freshnessResults = calculateFreshnessForTasks(activeTasks);
          
          let hasUpdates = false;
          const updatedTasks = state.tasks.map(task => {
            if (task.completed) return task;
            
            const freshnessResult = freshnessResults.get(task.id);
            if (freshnessResult && freshnessResult.shouldUpdate) {
              hasUpdates = true;
              return {
                ...task,
                freshnessState: freshnessResult.state,
              };
            }
            return task;
          });

          if (hasUpdates) {
            return {
              tasks: updatedTasks,
              lastUpdated: new Date(),
              error: null,
            };
          }

          return state;
        });
      },

      // Enhanced freshness update using the new updater
      updateFreshnessStatesEnhanced: async () => {
        try {
          const enhancedUpdater = getEnhancedFreshnessUpdater({
            debounceDelay: 500,
            batchSize: 15,
            useAnimationFrame: true,
            logPerformance: false,
          });
          
          const result = await enhancedUpdater.forceUpdate();
          
          if (result.updatedCount > 0) {
            // The enhanced updater handles the actual state updates
            // We just need to trigger a re-render and update metadata
            set((state) => ({
              ...state,
              lastUpdated: new Date(),
              error: null,
            }));
          }
          
          return result.updatedCount;
        } catch (error) {
          set((state) => ({
            ...state,
            error: `Enhanced freshness update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }));
          return 0;
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          try {
            // Use validation and recovery for local storage
            const recovered = validateAndRecoverLocalStorage(name);
            return recovered ? JSON.stringify(recovered) : null;
          } catch (error) {
            console.error('Failed to get item from storage:', error);
            // Try to recover using error recovery service
            errorRecoveryService.recoverLocalStorage(name);
            return null;
          }
        },
        setItem: (name: string, value: string) => {
          try {
            const parsed = JSON.parse(value);
            
            // Create backup before saving
            const currentData = localStorage.getItem(name);
            if (currentData) {
              errorRecoveryService.createBackup(name, JSON.parse(currentData));
            }
            
            // Convert Date objects to strings for storage
            if (parsed.state?.tasks) {
              parsed.state.tasks = parsed.state.tasks.map((task: Task) => ({
                ...task,
                dueDate: task.dueDate.toISOString(),
                createdAt: task.createdAt.toISOString(),
              }));
            }
            if (parsed.state?.lastUpdated) {
              parsed.state.lastUpdated = parsed.state.lastUpdated.toISOString();
            }
            localStorage.setItem(name, JSON.stringify(parsed));
          } catch (error) {
            console.error('Failed to save to storage:', error);
            // Fallback to simple storage
            localStorage.setItem(name, value);
          }
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      })),
      // Partial persistence - exclude loading and error states
      partialize: (state) => ({
        tasks: state.tasks,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

// Automatic freshness updater
let freshnessUpdateInterval: NodeJS.Timeout | null = null;

export const startFreshnessUpdates = (intervalMs: number = 60000) => {
  if (freshnessUpdateInterval) {
    clearInterval(freshnessUpdateInterval);
  }

  freshnessUpdateInterval = setInterval(() => {
    useTaskStore.getState().updateFreshnessStates();
  }, intervalMs);
};

export const stopFreshnessUpdates = () => {
  if (freshnessUpdateInterval) {
    clearInterval(freshnessUpdateInterval);
    freshnessUpdateInterval = null;
  }
};

// Initialize automatic updates when store is created
if (typeof window !== 'undefined') {
  startFreshnessUpdates();
}