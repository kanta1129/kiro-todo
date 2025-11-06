import type { Meta, StoryObj } from '@storybook/react';
import { TaskList } from './TaskList';
import type { Task } from '../../types';

const meta: Meta<typeof TaskList> = {
  title: 'Components/TaskList',
  component: TaskList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'TaskList component with sections and sorting functionality. Requirements: 3.5, 4.3, 2.4',
      },
    },
  },
  argTypes: {
    showCompleted: {
      control: 'boolean',
      description: 'Show completed tasks section',
    },
    sortBy: {
      control: 'select',
      options: ['dueDate', 'freshness', 'priority', 'createdAt'],
      description: 'Sort tasks by field',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskList>;

// Sample tasks for stories
const sampleTasks: Task[] = [
  {
    id: '1',
    title: '新鮮なタスク',
    description: '作成されたばかりの新しいタスクです',
    dueDate: new Date('2025-12-01'),
    createdAt: new Date('2025-11-06'),
    priority: 'high',
    completed: false,
    freshnessState: '新規',
  },
  {
    id: '2',
    title: '期限が近づいているタスク',
    description: '期限まで2日のタスクです',
    dueDate: new Date('2025-11-08'),
    createdAt: new Date('2025-11-01'),
    priority: 'medium',
    completed: false,
    freshnessState: '期限接近',
  },
  {
    id: '3',
    title: '期限間近のタスク',
    description: '期限まで1日を切ったタスクです',
    dueDate: new Date('2025-11-07'),
    createdAt: new Date('2025-10-15'),
    priority: 'high',
    completed: false,
    freshnessState: '期限間近',
  },
  {
    id: '4',
    title: '期限切れタスク',
    description: '期限を過ぎてしまったタスクです',
    dueDate: new Date('2025-11-01'),
    createdAt: new Date('2025-10-01'),
    priority: 'low',
    completed: false,
    freshnessState: '期限切れ',
  },
  {
    id: '5',
    title: '完了済みタスク',
    description: '既に完了したタスクです',
    dueDate: new Date('2025-11-15'),
    createdAt: new Date('2025-11-02'),
    priority: 'medium',
    completed: true,
    freshnessState: '新規',
  },
  {
    id: '6',
    title: '低優先度の新規タスク',
    description: '優先度が低い新しいタスクです',
    dueDate: new Date('2025-11-20'),
    createdAt: new Date('2025-11-05'),
    priority: 'low',
    completed: false,
    freshnessState: '新規',
  },
];

export const Default: Story = {
  args: {
    tasks: sampleTasks,
    showCompleted: false,
    sortBy: 'dueDate',
  },
};

export const WithCompletedTasks: Story = {
  args: {
    tasks: sampleTasks,
    showCompleted: true,
    sortBy: 'dueDate',
  },
  parameters: {
    docs: {
      description: {
        story: 'TaskList showing completed tasks section',
      },
    },
  },
};

export const SortedByFreshness: Story = {
  args: {
    tasks: sampleTasks,
    showCompleted: false,
    sortBy: 'freshness',
  },
  parameters: {
    docs: {
      description: {
        story: 'TaskList sorted by freshness state (新規 > 期限接近 > 期限間近 > 期限切れ)',
      },
    },
  },
};

export const SortedByPriority: Story = {
  args: {
    tasks: sampleTasks,
    showCompleted: false,
    sortBy: 'priority',
  },
  parameters: {
    docs: {
      description: {
        story: 'TaskList sorted by priority (high > medium > low)',
      },
    },
  },
};

export const FilteredByPriority: Story = {
  args: {
    tasks: sampleTasks,
    showCompleted: false,
    sortBy: 'dueDate',
    filterBy: {
      priority: ['high'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'TaskList filtered to show only high priority tasks',
      },
    },
  },
};

export const FilteredByFreshness: Story = {
  args: {
    tasks: sampleTasks,
    showCompleted: false,
    sortBy: 'dueDate',
    filterBy: {
      freshnessState: ['新規', '期限接近'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'TaskList filtered to show only fresh and approaching tasks',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    tasks: [],
    showCompleted: false,
    sortBy: 'dueDate',
  },
  parameters: {
    docs: {
      description: {
        story: 'TaskList empty state when no tasks are available',
      },
    },
  },
};

export const OnlyTombstones: Story = {
  args: {
    tasks: sampleTasks.filter(task => task.freshnessState === '期限切れ'),
    showCompleted: false,
    sortBy: 'dueDate',
  },
  parameters: {
    docs: {
      description: {
        story: 'TaskList showing only tombstone (overdue) tasks',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    tasks: sampleTasks,
    showCompleted: true,
    sortBy: 'dueDate',
    onTaskEdit: (id: string, updates) => {
      console.log('Edit task:', id, updates);
    },
    onTaskComplete: (id: string) => {
      console.log('Complete task:', id);
    },
    onTaskDelete: (id: string) => {
      console.log('Delete task:', id);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive TaskList with callback functions (check console for actions)',
      },
    },
  },
};