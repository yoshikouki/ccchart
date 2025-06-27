# Claude Code データ構造調査結果

## ディレクトリ構造

```
~/.claude/
├── CLAUDE.md           # グローバル設定ファイル
├── commands/           # コマンドディレクトリ
├── ide/                # IDE関連ファイル（ロックファイル）
├── projects/           # プロジェクトごとのデータ ⭐️ 重要
├── settings.json       # Claude Code の設定
├── statsig/           # Statsig関連キャッシュファイル
└── todos/             # Todo関連データ
```

## プロジェクトデータ管理

### プロジェクトディレクトリ命名規則

プロジェクトパス → ディレクトリ名変換：
- パスの区切り文字 `/` が `-` に置換
- 先頭に `-` が付与

**例**: `/Users/yoshikouki/src/github.com/yoshikouki/ccgraph`
→ `-Users-yoshikouki-src-github-com-yoshikouki-ccgraph`

### JSONL ファイル構造

各プロジェクトディレクトリ内：
```
~/.claude/projects/{プロジェクト名}/
├── 3fa2f6ab-5bc5-4c42-96cf-f0e78d71706d.jsonl  (32KB)
├── 5bc86a2f-8df9-4272-ad18-4f7ac91979d1.jsonl  (65KB) 
├── 8decf78a-e22f-4d52-a0c9-1243c5ce3892.jsonl  (603KB)
└── ...
```

- **ファイル名**: UUID形式（セッションID対応）
- **形式**: 1行1JSONオブジェクトのJSONL

## JSONLデータスキーマ

### 基本構造

```json
{
  "type": "user|assistant|summary",
  "uuid": "メッセージの一意識別子",
  "timestamp": "2024-12-27T15:20:44.123Z",
  "sessionId": "セッションID（ファイル名と対応）",
  "parentUuid": "親メッセージのUUID（null可）",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/Users/yoshikouki/src/github.com/yoshikouki/ccgraph",
  "version": "Claude Codeのバージョン",
  "message": {
    "role": "user|assistant",
    "content": "メッセージ内容またはツール使用情報",
    "usage": {
      "input_tokens": 1234,
      "output_tokens": 567,
      "cache_creation_input_tokens": 0,
      "cache_read_input_tokens": 0
    }
  }
}
```

### メッセージタイプ

- `user`: ユーザーからの入力
- `assistant`: Claudeからの応答（ツール使用含む）
- `summary`: セッションの要約

### 使用量データ取得のポイント

1. **トークン使用量**: `message.usage` 内で記録
2. **日時情報**: `timestamp` フィールド（ISO8601形式）
3. **セッション管理**: `sessionId` でセッション識別
4. **メッセージ系統**: `parentUuid` で親子関係追跡

## 実装に必要な機能

1. **プロジェクトディレクトリ検索**
   - カレントディレクトリからプロジェクト名生成
   - `~/.claude/projects/{プロジェクト名}/` 存在確認

2. **JSONL パース**
   - 各行のJSONパース
   - エラーハンドリング（不正なJSON行）

3. **使用量集計**
   - 日別でのトークン使用量合計
   - コスト計算（トークン単価は別途定義）

4. **日付グルーピング**
   - `timestamp` から日付抽出
   - タイムゾーン考慮

## 設定ファイル

`~/.claude/settings.json` で権限管理：
```json
{
  "permissions": {
    "allow": ["許可されたコマンドパターン"],
    "deny": ["拒否されたコマンドパターン"]
  }
}
```