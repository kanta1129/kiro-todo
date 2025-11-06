import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TaskForm } from '../index';
import { useTaskStore } from '../../../stores/taskStore';
import type { CreateTaskInput } from '../../../types';

// Mock the task store
vi.mock('../../../stores/taskStore');
const mockUseTaskStore = useTaskStore as vi.MockedFunction<typeof useTaskStore>;

// Mock store functions
const mockAddTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockClearError = vi.fn();

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTaskStore.mockReturnValue({
      tasks: [],
      addTask: mockAddTask,
      updateTask: mockUpdateTask,
      deleteTask: vi.fn(),
      completeTask: vi.fn(),
      updateFreshnessStates: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      clearError: mockClearError,
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
  });

  it('renders form fields correctly', () => {
    render(<TaskForm />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows editing mode when isEditing is true', () => {
    render(<TaskForm isEditing={true} />);

    expect(screen.getByText(/edit task/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument();
  });

  it('populates form with initial values', () => {
    const initialValues: Partial<CreateTaskInput> = {
      title: 'Initial Title',
      description: 'Initial Description',
      priority: 'high',
    };

    render(<TaskForm initialValues={initialValues} />);

    expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Initial Description')).toBeInTheDocument();
    
    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('high');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCancel = vi.fn();
    
    render(<TaskForm onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<TaskForm isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /create task/i });
    expect(submitButton).toBeDisabled();
    
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toBeDisabled();
  });

  it('displays store error when present', () => {
    mockUseTaskStore.mockReturnValue({
      tasks: [],
      addTask: mockAddTask,
      updateTask: mockUpdateTask,
      deleteTask: vi.fn(),
      completeTask: vi.fn(),
      updateFreshnessStates: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      clearError: mockClearError,
      isLoading: false,
      error: 'Store error message',
      lastUpdated: null,
    });

    render(<TaskForm />);

    expect(screen.getByText('Store error message')).toBeInTheDocument();
  });

  it('shows character count for description field', async () => {
    const user = userEvent.setup();
    render(<TaskForm />);

    const descriptionInput = screen.getByLabelText(/description/i);
    
    expect(screen.getByText('0/1000 characters')).toBeInTheDocument();

    await user.type(descriptionInput, 'Test description');

    expect(screen.getByText('16/1000 characters')).toBeInTheDocument();
  });

  it('calls custom onSubmit handler when provided', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();
    
    render(<TaskForm onSubmit={mockOnSubmit} />);

    // Fill out the form with valid data
    await user.type(screen.getByLabelText(/title/i), 'Test Task');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /create task/i }));

    // The onSubmit should be called (validation might prevent it, but that's expected behavior)
    // We're testing that the component attempts to call it
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});