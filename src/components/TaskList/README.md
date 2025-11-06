# TaskList Component

TaskList component with sections and sorting functionality.

## Requirements Coverage

- **3.5**: Tombstone tasks are separated into their own section
- **4.3**: Completed tasks can be filtered and shown in a separate section
- **2.4**: Tasks are automatically sorted by freshness state and due date

## Features

### Sections
- **Active Tasks**: Tasks that are not overdue (新規, 期限接近, 期限間近)
- **Tombstone Tasks**: Overdue tasks (期限切れ) displayed separately
- **Completed Tasks**: Optional section for completed tasks

### Sorting
- **Due Date**: Sort by task due date (ascending/descending)
- **Freshness**: Sort by freshness state priority (新規 > 期限接近 > 期限間近 > 期限切れ)
- **Priority**: Sort by task priority (high > medium > low)
- **Created Date**: Sort by task creation date

### Filtering
- **Priority Filter**: Show only tasks with specific priorities
- **Freshness Filter**: Show only tasks with specific freshness states
- **Completed Filter**: Toggle visibility of completed tasks

### Statistics
- Displays count of active, tombstone, completed, and total tasks
- Updates automatically as tasks change

## Usage

```tsx
import { TaskList } from './components/TaskList';

function App() {
  const tasks = [
    // ... your tasks
  ];

  return (
    <TaskList
      tasks={tasks}
      showCompleted={true}
      sortBy="freshness"
      filterBy={{
        priority: ['high', 'medium'],
        freshnessState: ['新規', '期限接近']
      }}
      onTaskEdit={(id, updates) => console.log('Edit:', id, updates)}
      onTaskComplete={(id) => console.log('Complete:', id)}
      onTaskDelete={(id) => console.log('Delete:', id)}
    />
  );
}
```

## Props

- `tasks`: Array of Task objects to display
- `showCompleted`: Boolean to show/hide completed tasks section
- `sortBy`: Field to sort tasks by ('dueDate' | 'freshness' | 'priority' | 'createdAt')
- `filterBy`: Object with priority and freshnessState arrays for filtering
- `onTaskEdit`: Callback for task editing
- `onTaskComplete`: Callback for task completion
- `onTaskDelete`: Callback for task deletion
- `className`: Additional CSS classes

## Stories

The component includes comprehensive Storybook stories demonstrating:
- Default view with all sections
- Completed tasks visibility
- Different sorting options
- Filtering by priority and freshness
- Empty state
- Tombstone-only view
- Interactive callbacks

## Implementation Details

- Uses React hooks for state management (sorting, revealed tombstones)
- Implements efficient sorting and filtering with useMemo
- Provides visual feedback for sort direction
- Handles tombstone reveal functionality
- Displays task statistics and counts
- Responsive design with mobile-friendly layout