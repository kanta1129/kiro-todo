# Requirements Document

## Introduction

タスクの鮮度管理TODOアプリは、タスクを生鮮食品や燃料のように扱い、時間経過や重要度に応じてタスクの「鮮度」や「状態」を視覚的に表現するタスク管理アプリケーションです。TypeScript、React、Next.jsを使用して開発されます。

## Glossary

- **Task_Freshness_System**: タスクの鮮度状態を管理し、視覚的表現を制御するシステム
- **Freshness_State**: タスクの現在の鮮度レベル（新規、期限接近、期限間近、期限切れ）
- **Visual_Effect_Engine**: タスクの状態に応じた視覚エフェクトを生成するコンポーネント
- **Task_Manager**: タスクのCRUD操作を管理するシステム
- **Tombstone_Mode**: 期限切れタスクの表示モード（内容を隠す状態）

## Requirements

### Requirement 1

**User Story:** As a user, I want to create new tasks with due dates, so that I can manage my work with visual freshness indicators.

#### Acceptance Criteria

1. WHEN a user creates a new task, THE Task_Manager SHALL assign a "新規" freshness state with vibrant visual appearance
2. THE Task_Manager SHALL require a due date for each task creation
3. THE Task_Manager SHALL display the task with fresh, vivid colors and lively visual effects
4. THE Task_Manager SHALL store the task creation timestamp for freshness calculation
5. THE Task_Manager SHALL allow users to set task priority levels

### Requirement 2

**User Story:** As a user, I want to see tasks change appearance as their due dates approach, so that I can prioritize my work based on visual urgency.

#### Acceptance Criteria

1. WHEN a task has 3 or more days until due date, THE Task_Freshness_System SHALL maintain "新規" state with vibrant appearance
2. WHEN a task has 1-3 days until due date, THE Task_Freshness_System SHALL transition to "期限接近" state with reduced saturation and slight browning effects
3. WHEN a task has 0-1 days until due date, THE Task_Freshness_System SHALL transition to "期限間近" state with decay effects, mold appearance, and darkening
4. THE Visual_Effect_Engine SHALL update task appearance automatically based on time calculations
5. THE Task_Freshness_System SHALL consider task priority in freshness decay rate

### Requirement 3

**User Story:** As a user, I want overdue tasks to become "tombstones" that hide their content, so that I can focus on current tasks while still being aware of overdue items.

#### Acceptance Criteria

1. WHEN a task becomes overdue, THE Task_Freshness_System SHALL transition to "期限切れ" tombstone state
2. THE Visual_Effect_Engine SHALL render overdue tasks as dark, decayed objects
3. WHEN a user clicks on a tombstone task, THE Task_Manager SHALL reveal the task content
4. THE Task_Manager SHALL allow users to revive tombstone tasks by updating their due dates
5. THE Task_Freshness_System SHALL maintain tombstone tasks in a separate visual section

### Requirement 4

**User Story:** As a user, I want to complete tasks and see them removed from the active list, so that I can track my progress and maintain a clean workspace.

#### Acceptance Criteria

1. WHEN a user marks a task as complete, THE Task_Manager SHALL remove it from the active task list
2. THE Task_Manager SHALL provide visual feedback for task completion
3. THE Task_Manager SHALL maintain a history of completed tasks
4. WHEN a task is completed, THE Visual_Effect_Engine SHALL display a satisfying completion animation
5. THE Task_Manager SHALL update task statistics and progress indicators

### Requirement 5

**User Story:** As a user, I want to edit existing tasks and see their freshness recalculated, so that I can update my plans while maintaining accurate visual indicators.

#### Acceptance Criteria

1. WHEN a user edits a task's due date, THE Task_Freshness_System SHALL recalculate and update the freshness state
2. THE Task_Manager SHALL allow editing of task title, description, and priority
3. WHEN task properties are modified, THE Visual_Effect_Engine SHALL smoothly transition to the new visual state
4. THE Task_Manager SHALL preserve task creation timestamp during edits
5. THE Task_Freshness_System SHALL immediately reflect changes in visual appearance