# 実装で得られた重要な知見

## Claude Code データ読み込みの実装知見

### 1. プロジェクトディレクトリ命名規則の発見

**問題**: Claude Code は `/` と `.` の両方をプロジェクトディレクトリ名で `-` に変換する

**実際の変換**:
```
/Users/yoshikouki/src/github.com/yoshikouki/ccgraph
↓
-Users-yoshikouki-src-github-com-yoshikouki-ccgraph
```

**実装ポイント**:
- ルートの `/` を除去してから変換
- ドット（`.`）もハイフン（`-`）に変換が必要
- 正規表現: `/[/.]/g` で一括変換

### 2. JSONL データの実際の構造

**予想との相違点**:
- `message.content` は文字列だけでなく配列の場合もある（assistant応答）
- `usage` は assistant メッセージのみに存在
- `timestamp` は必須だが、念のためチェックが重要

**対応**:
```typescript
// any[] ではなく unknown[] を使用してlint回避
content: string | unknown[];

// timestamp チェック必須
if (!timestamp) {
  continue;
}
```

### 3. 日別集計ロジックの注意点

**型安全性の確保**:
- Map から取得した値の null チェック必須
- TypeScript の strict mode では非 null アサーション（`!`）を避ける

**実装例**:
```typescript
const dailyUsage = dailyMap.get(date);
if (!dailyUsage) {
  continue; // 安全にスキップ
}
```

### 4. 実データと動作確認の結果

**パフォーマンス**:
- 8個の JSONL ファイル（最大 603KB）の読み込みは瞬時
- 日別集計処理も十分高速

**データ品質**:
- 実際の使用量: 71.5k tokens/day, $1.00/day
- JSONL パースエラーは想定通り continue で処理

## React Ink での非同期データ読み込み

### useEffect でのエラーハンドリング

**ベストプラクティス**:
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      // 非同期処理
    } catch (err) {
      // エラー状態管理
      setError(err instanceof Error ? err.message : "Unknown error");
      // フォールバック（モックデータ）
      setIsUsingMockData(true);
      setData(mockUsageData);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### ローディング UI の実装

**UX 配慮**:
- ローディング状態の明確な表示
- エラー時の警告表示
- モックデータ使用時の明示的な通知

## ファイルシステム操作の注意点

### Node.js API の型注意点

**`readdir` / `readFile` 戻り値**:
- Promise版を使用（`node:fs/promises`）
- エラーハンドリングは try-catch で確実に行う

### パス操作の統一

**ベストプラクティス**:
```typescript
import { join, resolve } from "node:path";

// 絶対パス化
const normalizedPath = resolve(projectPath);

// パス結合
const fullPath = join(baseDir, fileName);
```

## 今後の改善ポイント

1. **キャッシュ機能**: 同一プロジェクトの重複読み込み防止
2. **設定ファイル**: トークン単価の設定可能化
3. **時間範囲指定**: 特定期間のみの表示機能
4. **詳細モード**: セッション別・ファイル別の詳細表示
5. **エクスポート機能**: CSV/JSON形式でのデータ出力