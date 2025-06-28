# Claude Code データ形式と実装調査

## 使用量データの保存場所

Claude Code は使用履歴を JSONL 形式で `~/.claude/projects/` 下にローカル保存。

## 既存の類似ツール

- `ccusage` - Claude Code 使用量可視化 CLI ツール
- `Claude Code Usage Monitor` - VSCode 拡張機能

## 使用量データの例

```
日付: 2024-12-XX
入力トークン: 21,848 - 40,621
出力トークン: [データ不明]
総トークン: 21,848 - 40,621
コスト: $8.33 - $17.45/日
```

## 料金体系 (2025年現在)

### 従量課金
- Claude 4 Opus: $15/1M入力, $75/1M出力
- Claude 3.5 Sonnet: $3/1M入力, $15/1M出力
- Claude 3 Haiku: 最も安価

### 定額プラン
- Max 5x: $100/月/人
- Max 20x: $200/月/人

## 平均利用コスト

- 開発者1人あたり平均 $6/日
- 90%のユーザーが $12/日未満

## 実装に必要な機能

1. `~/.claude/projects/` からデータ読み込み
2. JSONL パースと日別集計
3. asciichart を使ったグラフ描画
4. React Ink でのリアルタイム表示