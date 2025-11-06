import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskItem } from '../TaskItem';
import type { Task } from '../../../types';

// Mock the visual effects components
vi.mock('../../VisualEffects/VisualEffectWrapper', () => ({
  VisualEffectWrapper: ({ children, onClick }: any) => (
    <div onClick={onClick} data-testid="visual-wrapper">
      {children}
    </div>
  ),
}));

vi.mock('../../VisualEffects/ParticleEffect', () => ({
  ParticleEffect: () => <div data-testid="particle-effect" />,
}));

const mockTask: Task = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'Test Description',
  dueDate: new Date('2024-12-31'),
  createdAt: new Date('2024-11-01'),
  priority: 'medium',
  completed: false,
  freshnessState: '新規',
};

describe('TaskItem', () => {
  it('renders task information correctly', () => {
    render(<TaskItem task={mockTask} />);
    
    expect(screen.getByTestId('task-title')).toHaveTextContent('Test Task');
    expect(screen.getByTestId('task-description')).toHaveTextContent('Test Description');
    expect(screen.getByTestId('task-priority')).toHaveTextContent('優先度: 中');
    expect(screen.getByTestId('task-freshness')).toHaveTextContent('状態: 新規');
  });

  it('shows tombstone mode for expired tasks', () => {
    const expiredTask = { ...mockTask, freshnessState: '期限切れ' as const };
    render(<TaskItem task={expiredTask} />);
    
    expect(screen.getByText('期限切れタスク - クリックして表示')).toBeInTheDocument();
    expect(screen.queryByTestId('task-title')).not.toBeInTheDocument();
  });

  it('reveals tombstone content when clicked', () => {
    const expiredTask = { ...mockTask, freshnessState: '期限切れ' as const };
    const onReveal = vi.fn();
    render(<TaskItem task={expiredTask} onReveal={onReveal} />);
    
    fireEvent.click(screen.getByTestId('visual-wrapper'));
    
    expect(onReveal).toHaveBeenCalledWith('test-task-1');
  });

  it('calls onComplete when complete button is clicked', () => {
    const onComplete = vi.fn();
    render(<TaskItem task={mockTask} onComplete={onComplete} />);
    
    fireEvent.click(screen.getByTestId('complete-button'));
    
    expect(onComplete).toHaveBeenCalledWith('test-task-1');
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<TaskItem task={mockTask} onDelete={onDelete} />);
    
    fireEvent.click(screen.getByTestId('delete-button'));
    
    expect(onDelete).toHaveBeenCalledWith('test-task-1');
  });

  it('enters edit mode when edit button is clicked', () => {
    render(<TaskItem task={mockTask} />);
    
    fireEvent.click(screen.getByTestId('edit-button'));
    
    expect(screen.getByTestId('task-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  it('calls onEdit when saving changes', () => {
    const onEdit = vi.fn();
    render(<TaskItem task={mockTask} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByTestId('edit-button'));
    
    const titleInput = screen.getByTestId('task-title-input');
    fireEvent.change(titleInput, { target: { value: 'Updated Task' } });
    fireEvent.click(screen.getByTestId('save-button'));
    
    expect(onEdit).toHaveBeenCalledWith('test-task-1', {
      title: 'Updated Task',
      description: 'Test Description',
    });
  });
});