# ccusage コマンド仕様

ccusage は Claude Code の使用量を表示するサードパーティツールです。本プロジェクト ccgraph の参考実装として詳細を記録します。

## 基本的な使用方法

```bash
bunx ccusage@latest
# または
bunx ccusage@latest daily
```

## コマンド一覧

### 1. daily（デフォルト）
日別使用量レポートを表示

### 2. monthly
月別使用量レポートを表示

### 3. session
会話セッション別使用量レポートを表示

### 4. blocks
セッション課金ブロック別使用量レポートを表示

### 5. mcp
使用量レポートツールを含む MCP サーバーを開始

## 共通オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-s, --since <date>` | 開始日フィルター（YYYYMMDD形式） | - |
| `-u, --until <date>` | 終了日フィルター（YYYYMMDD形式） | - |
| `-j, --json` | JSON形式で出力 | false |
| `-m, --mode <mode>` | コスト計算モード（auto/calculate/display） | auto |
| `-d, --debug` | 価格不一致情報をデバッグ表示 | false |
| `--debug-samples <n>` | デバッグ出力のサンプル数 | 5 |
| `-o, --order <order>` | ソート順（desc/asc） | asc |
| `-b, --breakdown` | モデル別コスト内訳を表示 | false |
| `-O, --offline` | キャッシュされた価格データを使用 | false |

## blocks コマンド専用オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-a, --active` | アクティブブロックのみ表示（予測付き） | false |
| `-r, --recent` | 過去3日間のブロックを表示 | false |
| `-t, --token-limit <limit>` | クォータ警告のトークン制限 | - |
| `-l, --session-length <hours>` | セッションブロック期間（時間） | 5 |
| `--live` | リアルタイム更新のライブ監視モード | false |
| `--refresh-interval <seconds>` | ライブモードの更新間隔 | 1 |

## mcp コマンド専用オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-t, --type <type>` | トランスポートタイプ（stdio/http） | stdio |
| `--port <port>` | HTTP トランスポートのポート | 8080 |

## JSON 出力構造

`--json` オプションを使用した場合、以下の構造で出力されます：

### daily レポートの JSON 構造

```typescript
interface DailyReport {
  daily: DailyUsage[];
  totals: TotalUsage;
}

interface DailyUsage {
  date: string; // "YYYY-MM-DD" 形式
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number; // USD
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
}

interface ModelBreakdown {
  modelName: string; // e.g., "claude-opus-4-20250514"
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number; // USD
}

interface TotalUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number; // USD
  totalTokens: number;
}
```

### 使用例

#### 日別使用量の JSON 出力
```bash
bunx ccusage@latest daily --json
```

#### 期間指定での使用量
```bash
bunx ccusage@latest daily --since 20250601 --until 20250630 --json
```

#### モデル別内訳付きの出力
```bash
bunx ccusage@latest daily --breakdown --json
```

## ccgraph との違い

- ccusage は各種レポート形式（daily/monthly/session/blocks）をサポート
- ccgraph は daily 形式のグラフ表示に特化
- ccusage は詳細なコスト計算機能を提供
- ccgraph は CLI グラフ表示にフォーカス

## データソース

両ツールとも `~/.claude/projects/` ディレクトリの JSONL ファイルから Claude Code の使用データを読み取ります。