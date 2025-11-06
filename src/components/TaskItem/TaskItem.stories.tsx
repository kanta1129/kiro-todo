import type { Meta, StoryObj } from '@storybook/react';
import { TaskItem } from './TaskItem';
import type { Task, FreshnessState } from '../../types';

// Mock task data generator
const createMockTask = (
  overrides: Partial<Task> = {}
): Task => {
  const baseDate = new Date('2024-01-15T10:00:00Z');
  
  return {
    id: 'task-1',
    title: 'サンプルタスク',
    description: 'これはタスクの説明文です。詳細な内容がここに表示されます。',
    dueDate: new Date('2024-01-20T10:00:00Z'),
    createdAt: baseDate,
    priority: 'medium',
    completed: false,
    freshnessState: '新規',
    ...overrides,
  };
};

const meta: Meta<typeof TaskItem> = {
  title: 'Components/TaskItem',
  component: TaskItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'TaskItem component displays individual tasks with visual freshness states. The component supports different visual states based on task freshness and includes tombstone mode for overdue tasks.',
      },
    },
  },
  argTypes: {
    task: {
      description: 'Task object containing all task data',
      control: { type: 'object' },
    },
    isRevealed: {
      description: 'Whether tombstone task content is revealed',
      control: { type: 'boolean' },
    },
    onEdit: {
      description: 'Callback when task is edited',
      action: 'edited',
    },
    onComplete: {
      description: 'Callback when task is completed',
      action: 'completed',
    },
    onDelete: {
      description: 'Callback when task is deleted',
      action: 'deleted',
    },
    onReveal: {
      description: 'Callback when tombstone task is revealed',
      action: 'revealed',
    },
  },
  args: {
    onEdit: () => {},
    onComplete: () => {},
    onDelete: () => {},
    onReveal: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Base story
export const Default: Story = {
  args: {
    task: createMockTask(),
  },
};

// Freshness State Stories - Requirements 2.1, 2.2, 2.3
export const FreshTask: Story = {
  name: '新規 (Fresh Task)',
  args: {
    task: createMockTask({
      freshnessState: '新規',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      title: '新規タスク - 鮮度良好',
      description: 'このタスクは新規作成されたばかりで、鮮やかな色で表示されます。',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: '新規状態のタスク。鮮やかな緑色と光るエフェクトで表示されます。期限まで3日以上ある場合の状態です。',
      },
    },
  },
};

export const ApproachingDeadline: Story = {
  name: '期限接近 (Approaching Deadline)',
  args: {
    task: createMockTask({
      freshnessState: '期限接近',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      title: '期限接近タスク',
      description: 'このタスクは期限が近づいており、色の彩度が低下し始めています。',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: '期限接近状態のタスク。彩度が低下し、わずかな茶色のグラデーションが現れます。期限まで1-3日の状態です。',
      },
    },
  },
};

export const NearDeadline: Story = {
  name: '期限間近 (Near Deadline)',
  args: {
    task: createMockTask({
      freshnessState: '期限間近',
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      title: '期限間近タスク - 緊急',
      description: 'このタスクは期限が間近に迫っており、腐敗エフェクトが現れています。',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: '期限間近状態のタスク。腐敗エフェクト、暗い色調、カビのテクスチャが表示されます。期限まで0-1日の状態です。',
      },
    },
  },
};

// Tombstone Stories - Requirement 3.2
export const OverdueTombstone: Story = {
  name: '期限切れ (Overdue Tombstone)',
  args: {
    task: createMockTask({
      freshnessState: '期限切れ',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      title: '期限切れタスク',
      description: 'このタスクは期限切れで、墓石モードで表示されています。',
    }),
    isRevealed: false,
  },
  parameters: {
    docs: {
      description: {
        story: '期限切れ状態のタスク（墓石モード）。内容が隠され、クリックで表示できます。',
      },
    },
  },
};

export const RevealedTombstone: Story = {
  name: '期限切れ (Revealed Tombstone)',
  args: {
    task: createMockTask({
      freshnessState: '期限切れ',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      title: '期限切れタスク（表示済み）',
      description: 'このタスクは期限切れですが、クリックにより内容が表示されています。',
    }),
    isRevealed: true,
  },
  parameters: {
    docs: {
      description: {
        story: '期限切れ状態のタスク（表示済み）。墓石モードから復活し、内容が表示されています。',
      },
    },
  },
};

// Priority Variations
export const HighPriorityFresh: Story = {
  name: 'High Priority Fresh',
  args: {
    task: createMockTask({
      priority: 'high',
      freshnessState: '新規',
      title: '高優先度タスク',
      description: '高優先度のタスクは鮮度の劣化が早くなります。',
    }),
  },
};

export const LowPriorityApproaching: Story = {
  name: 'Low Priority Approaching',
  args: {
    task: createMockTask({
      priority: 'low',
      freshnessState: '期限接近',
      title: '低優先度タスク',
      description: '低優先度のタスクは鮮度の劣化が遅くなります。',
    }),
  },
};

// Completed Task
export const CompletedTask: Story = {
  name: 'Completed Task',
  args: {
    task: createMockTask({
      completed: true,
      title: '完了済みタスク',
      description: 'このタスクは完了済みです。',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: '完了済みのタスク。取り消し線が表示され、アクションボタンが非表示になります。',
      },
    },
  },
};

// Interactive States
export const EditingMode: Story = {
  name: 'Editing Mode',
  args: {
    task: createMockTask({
      title: '編集中のタスク',
      description: 'このタスクは現在編集モードです。',
    }),
  },
  play: async ({ canvasElement }) => {
    // This would simulate clicking the edit button
    // For demonstration purposes, we'll just show the story
  },
  parameters: {
    docs: {
      description: {
        story: 'タスクの編集モード。タイトルと説明が入力フィールドに変わります。',
      },
    },
  },
};

// All Freshness States Comparison
export const AllFreshnessStates: Story = {
  name: 'All Freshness States',
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">全ての鮮度状態の比較</h3>
      
      <div className="space-y-4">
        <TaskItem
          task={createMockTask({
            id: 'fresh',
            freshnessState: '新規',
            title: '新規タスク',
            description: '鮮やかな緑色で表示',
          })}
          onEdit={() => {}}
          onComplete={() => {}}
          onDelete={() => {}}
        />
        
        <TaskItem
          task={createMockTask({
            id: 'approaching',
            freshnessState: '期限接近',
            title: '期限接近タスク',
            description: '彩度低下、茶色のグラデーション',
          })}
          onEdit={() => {}}
          onComplete={() => {}}
          onDelete={() => {}}
        />
        
        <TaskItem
          task={createMockTask({
            id: 'near',
            freshnessState: '期限間近',
            title: '期限間近タスク',
            description: '腐敗エフェクト、暗い色調',
          })}
          onEdit={() => {}}
          onComplete={() => {}}
          onDelete={() => {}}
        />
        
        <TaskItem
          task={createMockTask({
            id: 'overdue-hidden',
            freshnessState: '期限切れ',
            title: '期限切れタスク（隠し）',
            description: '墓石モード',
          })}
          isRevealed={false}
          onEdit={() => {}}
          onComplete={() => {}}
          onDelete={() => {}}
          onReveal={() => {}}
        />
        
        <TaskItem
          task={createMockTask({
            id: 'overdue-revealed',
            freshnessState: '期限切れ',
            title: '期限切れタスク（表示）',
            description: '墓石モードから復活',
          })}
          isRevealed={true}
          onEdit={() => {}}
          onComplete={() => {}}
          onDelete={() => {}}
          onReveal={() => {}}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '全ての鮮度状態を一度に比較できるストーリー。視覚的な違いを確認できます。',
      },
    },
  },
};

// Interactive Controls Story
export const InteractiveControls: Story = {
  name: 'Interactive Controls',
  args: {
    task: createMockTask(),
    isRevealed: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'インタラクティブなコントロールでタスクの各プロパティを変更して、視覚的な変化を確認できます。Controlsパネルでタスクのプロパティを変更してください。',
      },
    },
  },
};