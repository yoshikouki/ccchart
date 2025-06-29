# ccchart

Claude Code の使用量を React Ink を使って CLI 上でチャート表示するためのプロジェクトです。

## 目標

`npx ccchart@latest` などの実行で、Claude Code の使用量がチャートで表示されるようにします。
まずは日別使用量グラフ表示の PoC として開発を進めています。

## 開発環境

- **Runtime**: Bun v1.2.10+
- **Language**: TypeScript
- **UI Framework**: React Ink (予定)
- **Test Framework**: Vitest
- **Linter/Formatter**: Biome

## セットアップ

依存関係のインストール:

```bash
bun install
```

## 開発コマンド

```bash
# テスト実行
bun run test

# テスト監視モード
bun run test:watch

# リント
bun run lint

# フォーマット
bun run format

# 型チェック
bun run typecheck
```

## プロジェクト構造

- `src/` - メインソースコード
- `docs/` - Claude Code や React Ink に関する技術情報
- `CLAUDE.md` - Claude Code 用の開発ガイドライン
- `index.ts` - エントリーポイント

## 開発ルール

1. Claude Code や React Ink について自明でないことは `./docs` に記録
2. 変更を加えた度に commit を実行
3. 理解→計画→実装→コミットのワークフローに従う
