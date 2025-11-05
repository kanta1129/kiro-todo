# Design Document

## Overview

タスクの鮮度管理TODOアプリは、Next.js 14のApp Routerを使用したモダンなReactアプリケーションとして設計されます。タスクの状態を視覚的に表現するために、CSS-in-JSとアニメーションライブラリを活用し、リアルタイムでタスクの「鮮度」を更新する仕組みを実装します。

## Architecture

### Frontend Architecture
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main todo page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── TaskList/          # Task list container
│   ├── TaskItem/          # Individual task component
│   ├── TaskForm/          # Task creation/editing form
│   └── VisualEffects/     # Visual effect components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── stores/                # State management (Zustand)
└── types/                 # TypeScript type definitions
```

### State Management
- **Zustand**: 軽量で型安全な状態管理
- **Local Storage**: タスクデータの永続化
- **Real-time Updates**: setIntervalを使用した鮮度状態の自動更新

## Components and Interfaces

### Core Types
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  freshnessState: FreshnessState;
}

type FreshnessState = '新規' | '期限接近' | '期限間近' | '期限切れ';

interface VisualTheme {
  colors: string[];
  effects: string[];
  animations: string[];
}
```

### TaskItem Component
- **Props**: Task object, onEdit, onComplete, onDelete callbacks
- **State**: hover state, click state for tombstone reveal
- **Visual Effects**: 
  - 新規: 鮮やかな緑色、微細な光るエフェクト
  - 期限接近: 彩度低下、わずかな茶色のグラデーション
  - 期限間近: 腐敗エフェクト、暗い色調、カビのテクスチャ
  - 期限切れ: 黒い塊、クリックで内容表示

### TaskList Component
- **Sections**: Active tasks, Tombstone tasks
- **Sorting**: 鮮度状態別、期限順
- **Filtering**: 完了済み非表示、優先度フィルター

### VisualEffectEngine
- **CSS Variables**: 動的な色とエフェクトの管理
- **Keyframe Animations**: 状態遷移のスムーズなアニメーション
- **Particle Effects**: 腐敗や光るエフェクトの実装

## Data Models

### Task Store (Zustand)
```typescript
interface TaskStore {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'freshnessState'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  updateFreshnessStates: () => void;
}
```

### Freshness Calculation Logic
```typescript
function calculateFreshness(task: Task): FreshnessState {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Priority affects decay rate
  const priorityMultiplier = {
    high: 0.8,    // Decays faster
    medium: 1.0,  // Normal decay
    low: 1.2      // Decays slower
  };
  
  const adjustedDays = daysUntilDue * priorityMultiplier[task.priority];
  
  if (adjustedDays < 0) return '期限切れ';
  if (adjustedDays <= 1) return '期限間近';
  if (adjustedDays <= 3) return '期限接近';
  return '新規';
}
```

## Error Handling

### Client-Side Error Boundaries
- **TaskErrorBoundary**: タスク関連エラーのキャッチ
- **VisualEffectErrorBoundary**: アニメーションエラーの処理
- **Fallback UI**: エラー時の代替表示

### Data Validation
- **Zod Schema**: タスクデータの型安全性
- **Date Validation**: 期限日の妥当性チェック
- **Local Storage Error Handling**: データ読み込み失敗時の対応

## Testing Strategy

### Unit Testing (Jest + React Testing Library)
- **Task Store**: 状態管理ロジックのテスト
- **Freshness Calculation**: 鮮度計算アルゴリズムのテスト
- **Component Rendering**: 各コンポーネントの表示テスト

### Integration Testing
- **Task Lifecycle**: 作成→編集→完了の流れ
- **Visual State Transitions**: 鮮度状態の変化テスト
- **Local Storage Integration**: データ永続化のテスト

### Visual Testing
- **Storybook**: コンポーネントの視覚的テスト
- **Screenshot Testing**: 各鮮度状態の外観確認

## Performance Considerations

### Optimization Strategies
- **React.memo**: TaskItemコンポーネントの不要な再レンダリング防止
- **useMemo**: 鮮度計算結果のメモ化
- **Debounced Updates**: 鮮度状態更新の頻度制限
- **CSS Animations**: JavaScriptアニメーションよりもパフォーマンス重視

### Bundle Size Management
- **Tree Shaking**: 未使用コードの除去
- **Dynamic Imports**: 必要時のみコンポーネント読み込み
- **CSS Optimization**: 不要なスタイルの削除