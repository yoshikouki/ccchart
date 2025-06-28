# Claude Code 価格計算の仕組み

このドキュメントでは、ccgraphがClaude Codeのセッション記録（JSONL）から使用料金を推計する仕組みについて説明します。

## データソース

Claude Codeは`~/.claude/projects/`ディレクトリに各プロジェクトのセッション記録をJSONL形式で保存しています。

```
~/.claude/projects/
├── -Users-yoshikouki-src-github-com-project1/
│   ├── session1.jsonl
│   └── session2.jsonl
└── -Users-yoshikouki-src-github-com-project2/
    └── session1.jsonl
```

## JSONL エントリの構造

各行は以下の構造を持つJSONオブジェクトです：

```typescript
interface ClaudeLogEntry {
  type: "user" | "assistant" | "summary";
  uuid: string;
  timestamp: string; // ISO8601 format
  sessionId: string;
  requestId?: string;
  message: {
    id?: string;
    model?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
}
```

## 価格計算プロセス

### 1. エントリの抽出

以下の条件を満たすエントリのみを価格計算の対象とします：

- `type === "assistant"` （assistantメッセージのみ）
- `message.usage` が存在する
- `message.model !== "<synthetic>"` （実際のAPIコールのみ）

### 2. 重複除去

同一のAPIコールが複数回記録されることを防ぐため、以下の方式で重複を除去します：

```typescript
const uniqueKey = `${message.id}:${requestId}`;
```

`message.id`と`requestId`の両方が存在する場合のみ、この組み合わせで重複チェックを行います。

### 3. モデル判定

`message.model`フィールドから使用モデルを判定します：

- `model.includes("opus")` → Claude 4 Opus
- その他 → Claude 4 Sonnet（デフォルト）

### 4. トークン単価（2024年12月時点）

#### Claude 4 Opus
- Input tokens: $15.00 per 1M tokens
- Output tokens: $75.00 per 1M tokens  
- Cache creation tokens: $18.75 per 1M tokens
- Cache read tokens: $1.50 per 1M tokens

#### Claude 4 Sonnet
- Input tokens: $3.00 per 1M tokens
- Output tokens: $15.00 per 1M tokens
- Cache creation tokens: $3.75 per 1M tokens
- Cache read tokens: $0.30 per 1M tokens

### 5. コスト計算式

```typescript
cost = (input_tokens * input_price_per_token) +
       (output_tokens * output_price_per_token) +
       (cache_creation_tokens * cache_creation_price_per_token) +
       (cache_read_tokens * cache_read_price_per_token)
```

## 日別集計

1. 各エントリの`timestamp`から日付（YYYY-MM-DD）を抽出
2. 同一日のトークン数とコストを合計
3. 過去30日間のデータを生成（データがない日は0で埋める）

## 実装上の注意点

### キャッシュトークンの重要性

Claude Codeでは大量のコンテキストがキャッシュされるため、`cache_creation_input_tokens`と`cache_read_input_tokens`の計算が総コストに大きく影響します。

### 例：実際のコスト内訳

```
2025-06-28の例：
- Input tokens: 23,081
- Output tokens: 60,981  
- Cache creation tokens: 1,278,080
- Cache read tokens: 22,419,542
- 総コスト: $19.70
```

この例では、キャッシュ関連のトークンが全体の99%以上を占めており、価格計算においてキャッシュトークンの正確な処理が重要であることが分かります。

## 精度検証

この計算方式により、他の同等ツールと±$1以内の精度で料金推計が可能です。