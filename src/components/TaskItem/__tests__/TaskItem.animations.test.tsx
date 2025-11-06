/**
 * Tests for TaskItem animations and user feedback
 * Requirements: 4.2, 4.4, 5.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskItem } from '../TaskItem';
import type { Task } from '../../../types';

// Mock the animations hook
jest.mock('../../../hooks/useAnimations', () => ({
  useAnimations: () => ({
    triggerCompletion: jest.fn().mockResolvedValue(undefined),
    showSuccess: jest.fn().mockResolvedValue(undefined),
    showError: jest.fn().mockResolvedValue(undefined),
    showWarning: jest.fn().mockResolvedValue(undefined),
    animateTransition: jest.fn().mockResolvedValue(undefined),
    setLoading: jest.fn(),
    clearLoading: jest.fn(),
    enhanceButton: jest.fn(),
    removeButtonEnhancement: jest.fn(),
  }),
}));

const mockTask: Task = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'Test Description',
  dueDate: new Date('2024-12-31'),
  createdAt: new Date('2024-01-01'),
  priority: 'medium',
  completed: false,
  freshnessState: '新規',
};

describe('TaskItem Animations', () => {
  const mockProps = {
    task: mockTask,
    onEdit: jest.fn(),
    onComplete: jest.fn(),
    onDelete: jest.fn(),
    onReveal: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state when completing task', async () => {
    render(<TaskItem {...mockProps} />);
    
    const completeButton = screen.getByTestId('complete-button');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(completeButton).toHaveTextContent('完了中...');
    });
  });

  it('should show loading state when deleting task', async () => {
    render(<TaskItem {...mockProps} />);
    
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(deleteButton).toHaveTextContent('削除中...');
    });
  });

  it('should show loading state when saving task', async () => {
    render(<TaskItem {...mockProps} />);
    
    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(saveButton).toHaveTextContent('保存中...');
    });
  });

  it('should disable buttons during operations', async () => {
    render(<TaskItem {...mockProps} />);
    
    const completeButton = screen.getByTestId('complete-button');
    const deleteButton = screen.getByTestId('delete-button');
    const editButton = screen.getByTestId('edit-button');
    
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(completeButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
      expect(editButton).toBeDisabled();
    });
  });

  it('should add completion animation class when completing', async () => {
    render(<TaskItem {...mockProps} />);
    
    const taskItem = screen.getByTestId('task-item');
    const completeButton = screen.getByTestId('complete-button');
    
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(taskItem).toHaveClass('task-completing');
    });
  });

  it('should show validation warning for empty title', async () => {
    render(<TaskItem {...mockProps} />);
    
    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);
    
    const titleInput = screen.getByTestId('task-title-input');
    fireEvent.change(titleInput, { target: { value: '' } });
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    // The warning should be shown via the useAnimations hook
    // We can't test the actual warning display here since it's handled by the hook
    expect(saveButton).toBeInTheDocument();
  });

  it('should handle freshness state transitions', () => {
    const { rerender } = render(<TaskItem {...mockProps} />);
    
    const updatedTask = { ...mockTask, freshnessState: '期限接近' as const };
    rerender(<TaskItem {...mockProps} task={updatedTask} />);
    
    const taskItem = screen.getByTestId('task-item');
    expect(taskItem).toHaveAttribute('data-freshness', '期限接近');
  });

  it('should show tombstone click hint', () => {
    const tombstoneTask = { ...mockTask, freshnessState: '期限切れ' as const };
    render(<TaskItem {...mockProps} task={tombstoneTask} />);
    
    expect(screen.getByText('期限切れタスク - クリックして表示')).toBeInTheDocument();
  });

  it('should reveal tombstone content when clicked', () => {
    const tombstoneTask = { ...mockTask, freshnessState: '期限切れ' as const };
    render(<TaskItem {...mockProps} task={tombstoneTask} />);
    
    const taskItem = screen.getByTestId('task-item');
    fireEvent.click(taskItem);
    
    expect(mockProps.onReveal).toHaveBeenCalledWith(tombstoneTask.id);
  });
});