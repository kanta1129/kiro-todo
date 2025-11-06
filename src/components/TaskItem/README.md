# TaskItem Storybook Stories

このディレクトリには、TaskItem コンポーネントの Storybook ストーリーが含まれています。

## ファイル構成

- `TaskItem.stories.tsx` - メインのストーリー定義
- `TaskItem.stories.mdx` - ドキュメント付きストーリー
- `__tests__/TaskItem.stories.test.tsx` - ストーリーのテスト

## 実装された機能

### 鮮度状態の視覚化 (Requirements 2.1, 2.2, 2.3)

1. **新規 (Fresh)** - 鮮やかな緑色、光るエフェクト
2. **期限接近 (Approaching)** - 彩度低下、茶色のグラデーション
3. **期限間近 (Near Deadline)** - 腐敗エフェクト、暗い色調
4. **期限切れ (Overdue)** - 墓石モード

### 墓石モード (Requirement 3.2)

- 期限切れタスクの内容を隠す
- クリックで内容を表示
- 復活状態の表示

### インタラクティブコントロール

- 全ての鮮度状態をリアルタイムで切り替え
- 優先度、完了状態の変更
- タイトル、説明の編集

## Storybook の起動

```bash
npm run storybook
```

ブラウザで http://localhost:6006 にアクセスして、TaskItem コンポーネントのストーリーを確認できます。

## ストーリーの種類

1. **Default** - 基本的なタスク表示
2. **FreshTask** - 新規状態のタスク
3. **ApproachingDeadline** - 期限接近状態
4. **NearDeadline** - 期限間近状態
5. **OverdueTombstone** - 墓石モード（隠し）
6. **RevealedTombstone** - 墓石モード（表示）
7. **AllFreshnessStates** - 全状態の比較表示
8. **InteractiveControls** - インタラクティブテスト

## テスト

ストーリーは自動的にテストされ、各鮮度状態が正しく表示されることを確認します：

```bash
npm test
```

## 要件との対応

- ✅ **要件 2.1**: 新規状態の視覚的表現
- ✅ **要件 2.2**: 期限接近・期限間近状態の視覚的変化
- ✅ **要件 2.3**: 自動的な状態遷移の視覚化
- ✅ **要件 3.2**: 墓石モードの実装