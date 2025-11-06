import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskList } from '../TaskList';
import type { Task } from '../../../types';

// Mock TaskItem component
vi.mock('../../TaskItem/TaskItem', () => ({
  TaskItem: ({ task, onEdit, onComplete, onDelete, onReveal }: any) => (
    <div data-testid={`task-item-${task.id}`} data-freshness={task.freshnessState}>
      <span>{task.title}</span>
      <button onClick={() => onEdit?.(task.id, { title: 'edited' })}>Edit</button>
      <button onClick={() => onComplete?.(task.id)}>Complete</button>
      <button onClick={() => onDelete?.(task.id)}>Delete</button>
      <button onClick={() => onReveal?.(task.id)}>Reveal</button>
    </div>
  ),
}));

describe('TaskList', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Fresh Task',
      description: 'A fresh task',
      dueDate: new Date('2025-12-01'),
      createdAt: new Date('2025-11-01'),
      priority: 'high',
      completed: false,
      freshnessState: '新規',
    },
    {
      id: '2',
      title: 'Approaching Task',
      description: 'Task approaching deadline',
      dueDate: new Date('2025-11-08'),
      createdAt: new Date('2025-11-02'),
      priority: 'medium',
      completed: false,
      freshnessState: '期限接近',
    },
    {
      id: '3',
      title: 'Overdue Task',
      description: 'An overdue task',
      dueDate: new Date('2025-11-01'),
      createdAt: new Date('2025-10-01'),
      priority: 'low',
      completed: false,
      freshnessState: '期限切れ',
    },
    {
      id: '4',
      title: 'Completed Task',
      description: 'A completed task',
      dueDate: new Date('2025-11-15'),
      createdAt: new Date('2025-11-03'),
      priority: 'medium',
      completed: true,
      freshnessState: '新規',
    },
  ];

  const defaultProps = {
    tasks: mockTasks,
    onTaskEdit: vi.fn(),
    onTaskComplete: vi.fn(),
    onTaskDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task list with sections', () => {
    render(<TaskList {...defaultProps} />);
    
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
    expect(screen.getByTestId('active-tasks-section')).toBeInTheDocument();
    expect(screen.getByTestId('tombstone-tasks-section')).toBeInTheDocument();
  });

  it('separates active and tombstone tasks correctly', () => {
    render(<TaskList {...defaultProps} />);
    
    const activeSection = screen.getByTestId('active-tasks-section');
    const tombstoneSection = screen.getByTestId('tombstone-tasks-section');
    
    // Active tasks should contain fresh and approaching tasks
    expect(within(activeSection).getByTestId('task-item-1')).toBeInTheDocument();
    expect(within(activeSection).getByTestId('task-item-2')).toBeInTheDocument();
    
    // Tombstone section should contain overdue task
    expect(within(tombstoneSection).getByTestId('task-item-3')).toBeInTheDocument();
  });

  it('shows completed tasks when showCompleted is true', () => {
    render(<TaskList {...defaultProps} showCompleted={true} />);
    
    expect(screen.getByTestId('completed-tasks-section')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-4')).toBeInTheDocument();
  });

  it('hides completed tasks when showCompleted is false', () => {
    render(<TaskList {...defaultProps} showCompleted={false} />);
    
    expect(screen.queryByTestId('completed-tasks-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('task-item-4')).not.toBeInTheDocument();
  });

  it('renders sort controls', () => {
    render(<TaskList {...defaultProps} />);
    
    expect(screen.getByTestId('sort-by-due-date')).toBeInTheDocument();
    expect(screen.getByTestId('sort-by-freshness')).toBeInTheDocument();
    expect(screen.getByTestId('sort-by-priority')).toBeInTheDocument();
    expect(screen.getByTestId('sort-by-created')).toBeInTheDocument();
  });

  it('changes sort order when clicking sort buttons', () => {
    render(<TaskList {...defaultProps} />);
    
    const freshnessButton = screen.getByTestId('sort-by-freshness');
    
    // Initial state should show ascending indicator
    expect(freshnessButton).toHaveTextContent('鮮度');
    
    // Click to sort by freshness
    fireEvent.click(freshnessButton);
    expect(freshnessButton).toHaveTextContent('鮮度 ↑');
    
    // Click again to reverse order
    fireEvent.click(freshnessButton);
    expect(freshnessButton).toHaveTextContent('鮮度 ↓');
  });

  it('displays task statistics', () => {
    render(<TaskList {...defaultProps} showCompleted={true} />);
    
    const statistics = screen.getByTestId('task-statistics');
    expect(statistics).toBeInTheDocument();
    
    // Should show correct counts
    expect(statistics).toHaveTextContent('2'); // Active tasks
    expect(statistics).toHaveTextContent('1'); // Tombstone tasks
    expect(statistics).toHaveTextContent('1'); // Completed tasks
    expect(statistics).toHaveTextContent('4'); // Total tasks
  });

  it('shows empty state when no tasks', () => {
    render(<TaskList {...defaultProps} tasks={[]} />);
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('タスクがありません')).toBeInTheDocument();
  });

  it('calls callback functions correctly', () => {
    const onEdit = vi.fn();
    const onComplete = vi.fn();
    const onDelete = vi.fn();
    
    render(
      <TaskList
        {...defaultProps}
        onTaskEdit={onEdit}
        onTaskComplete={onComplete}
        onTaskDelete={onDelete}
      />
    );
    
    // Test edit callback
    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(onEdit).toHaveBeenCalledWith('1', { title: 'edited' });
    
    // Test complete callback
    fireEvent.click(screen.getAllByText('Complete')[0]);
    expect(onComplete).toHaveBeenCalledWith('1');
    
    // Test delete callback
    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('filters tasks by priority', () => {
    const filterBy = { priority: ['high' as const] };
    render(<TaskList {...defaultProps} filterBy={filterBy} />);
    
    // Should only show high priority task
    expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
    expect(screen.queryByTestId('task-item-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('task-item-3')).not.toBeInTheDocument();
  });

  it('filters tasks by freshness state', () => {
    const filterBy = { freshnessState: ['新規' as const] };
    render(<TaskList {...defaultProps} filterBy={filterBy} />);
    
    // Should only show fresh tasks
    expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
    expect(screen.queryByTestId('task-item-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('task-item-3')).not.toBeInTheDocument();
  });
});