import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeUpdates } from '../useRealTimeUpdates';
import { useTaskStore } from '../../stores/taskStore';

// Mock the task store
jest.mock('../../stores/taskStore');
jest.mock('../useFreshness');

const mockTaskStore = useTaskStore as jest.MockedFunction<typeof useTaskStore>;

describe('useRealTimeUpdates', () => {
  const mockUpdateFreshnessStatesEnhanced = jest.fn();
  const mockTasks = [
    {
      id: '1',
      title: 'Test Task 1',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      completed: false,
      freshnessState: '新規' as const,
      priority: 'medium' as const,
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Test Task 2',
      dueDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      completed: false,
      freshnessState: '期限間近' as const,
      priority: 'high' as const,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockTaskStore.mockReturnValue({
      tasks: mockTasks,
      updateFreshnessStatesEnhanced: mockUpdateFreshnessStatesEnhanced,
    } as any);

    mockUpdateFreshnessStatesEnhanced.mockResolvedValue(2);

    // Mock useFreshness hook
    require('../useFreshness').useFreshness = jest.fn(() => ({
      hasPendingUpdates: jest.fn(() => true),
      isAutoUpdateActive: true,
      lastUpdateTime: Date.now(),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    expect(result.current.isActive).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.lastUpdateCount).toBe(0);
    expect(result.current.timeUntilNextUpdate).toBe(60000); // 1 minute default
  });

  it('should start real-time updates', async () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);
  });

  it('should stop real-time updates', async () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isActive).toBe(false);
  });

  it('should perform force update', async () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    let updateCount: number;
    await act(async () => {
      updateCount = await result.current.forceUpdate();
    });

    expect(updateCount).toBe(2);
    expect(mockUpdateFreshnessStatesEnhanced).toHaveBeenCalledTimes(1);
    expect(result.current.lastUpdateCount).toBe(2);
  });

  it('should handle debounced updates', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({
      debounceDelay: 500,
    }));

    act(() => {
      result.current.start();
    });

    // Fast-forward through debounce delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockUpdateFreshnessStatesEnhanced).toHaveBeenCalled();
    });
  });

  it('should provide performance metrics', () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    const metrics = result.current.getPerformanceMetrics();

    expect(metrics).toHaveProperty('averageDuration');
    expect(metrics).toHaveProperty('averageUpdateCount');
    expect(metrics).toHaveProperty('totalUpdates');
    expect(metrics).toHaveProperty('lastUpdateDuration');
  });

  it('should reset timer correctly', () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.timeUntilNextUpdate).toBe(60000);
  });

  it('should handle update intervals correctly', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({
      updateInterval: 30000, // 30 seconds
    }));

    act(() => {
      result.current.start();
    });

    // Fast-forward to trigger interval update
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockUpdateFreshnessStatesEnhanced).toHaveBeenCalled();
    });
  });

  it('should handle errors gracefully', async () => {
    mockUpdateFreshnessStatesEnhanced.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useRealTimeUpdates());

    let updateCount: number;
    await act(async () => {
      updateCount = await result.current.forceUpdate();
    });

    expect(updateCount).toBe(0);
    expect(result.current.isUpdating).toBe(false);
  });

  it('should track task count changes', async () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    // Initial force update
    await act(async () => {
      await result.current.forceUpdate();
    });

    // Change task count
    mockTaskStore.mockReturnValue({
      tasks: [...mockTasks, {
        id: '3',
        title: 'New Task',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        completed: false,
        freshnessState: '新規' as const,
        priority: 'low' as const,
        createdAt: new Date(),
      }],
      updateFreshnessStatesEnhanced: mockUpdateFreshnessStatesEnhanced,
    } as any);

    // Another force update should detect the change
    await act(async () => {
      await result.current.forceUpdate();
    });

    expect(mockUpdateFreshnessStatesEnhanced).toHaveBeenCalledTimes(2);
  });
});