# React Ink 開発メモ

## React Ink とは

React を使って CLI アプリケーションを構築するためのライブラリ。
Yoga レイアウトエンジンを使用してターミナル内で Flexbox レイアウトを実現。

## 主要な特徴

- React コンポーネントをターミナルで使用可能
- クラスベース・関数コンポーネント、フック、ライフサイクルメソッドすべて対応
- `useInput` フックでユーザー入力に対応可能
- React DevTools サポート
- ink-testing-library でテスト可能

## 使用例

GitHub Copilot、Gatsby、Prisma、Shopify、Claude Code など大手企業・プロジェクトで採用。

## 基本的な使用法

```typescript
import React from 'react';
import { render, Text } from 'ink';

const App = () => <Text>Hello World</Text>;

render(<App />);
```

## 利用可能なコンポーネント

- `<Text>` - テキスト表示
- `<Box>` - レイアウト用コンテナ（Flexbox）
- `<Newline>` - 改行
- `<Spacer>` - スペース
- `<Static>` - 静的コンテンツ（スクロールしない）

## 関連ライブラリ

- `ink-ui` - 追加コンポーネント（テキスト入力、アラート、リストなど）
- `pastel` - Next.js にインスパイアされた CLI フレームワーク
- `create-ink-app` - プロジェクト生成ツール

## Claude Code での使用

Claude Code 自体も Ink を使用して構築されている。