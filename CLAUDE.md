# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ccchart は Claude Code の使用量を React Ink を使用して CLI 上でチャート表示するプロジェクトである。`npx ccchart@latest` のような実行で使用量チャートを表示することを目標とし、まずは日別チャートの PoC から開発を進める。

## Development Principles

### Core Principles

- Don't hold back. Give it your all.
- Always Think in English, but respond in Japanese.
- For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
- MUST use subagents for complex problem verification
- After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding. Use your thinking to plan and iterate based on this new information, and then take the best next action.

### Workflow Structure

- Follow Explore-Plan-Code-Commit approach: 理解→計画→実装→コミット
- Always read and understand existing code before making changes
- Create detailed plans before implementation
- Use iterative approaches
- Course-correct early and frequently
- Commit early and often

### Context Management

- MUST update and maintain CLAUDE.md files for persistent project context
- Document project-specific patterns and conventions

### Problem-Solving Approach

- Leverage thinking capabilities for complex multi-step reasoning
- Focus on understanding problem requirements rather than just passing tests
- Use test-driven development

### Tool and Resource Optimization

- Optimize tool usage with parallel calling for maximum efficiency
- Use subagents for complex problem verification

## Development Environment

- **Runtime**: Bun v1.2.10+
- **Language**: TypeScript with ESNext target
- **Package Manager**: Bun (do NOT use npm or yarn)
- **Linter/Formatter**: Biome with space indentation and 96 character line width
- **Test Framework**: Vitest

## Core Commands

- `bun run test` - Run all tests
- `bun run test:watch` - Run tests in watch mode
- `bun run lint` - Lint the codebase
- `bun run format` - Format and auto-fix code
- `bun run format:unsafe` - Format with unsafe fixes
- `bun run typecheck` - Type check without emitting files
- `./index.tsx` - Run the CLI tool directly
- `./index.tsx --debug` - Run with debug output

## Project Structure

- `src/` - Main source code
  - `App.tsx` - Main React Ink application component
  - `components/` - Reusable UI components (UsageGraph, etc.)
  - `types/` - TypeScript type definitions for Claude data structures
  - `utils/` - Utility functions for data processing and file operations
- `docs/` - Claude Code や React Ink について自明でない事項や記録すべき情報
- `index.tsx` - CLI entry point with shebang for direct execution
- Configuration files: `biome.json`, `tsconfig.json`, `vitest.config.ts`

## Development Rules

1. Claude Code や React Ink について自明でない事項は `./docs` に記録すること
2. ルールとして適切なものは `./CLAUDE.md` にも記載すること
3. 変更を加えるたびに commit を実行すること
4. 最新のドキュメントを必ず参照し、それに準拠した実装を行うこと
5. ライブラリ導入時は必ず公式ドキュメントや最新の情報を Web 検索で確認すること
6. 依存関係のインストールには Bun を使用し、npm や yarn は使用しないこと
7. **MUST**: 依存関係を操作する際は必ず package.json を確認すること

## TypeScript Configuration

- ESNext features enabled
- Strict mode enabled
- JSX configured for React
- Module resolution set to bundler mode
- No emit mode (handled by Bun)

## Code Style

- Space indentation (configured in Biome)
- Double quotes for strings
- Line width: 96 characters
- Unused imports automatically removed
- Import organization enabled

## Testing

- Tests located in `src/` alongside source files (e.g., `sum.test.ts`)
- Coverage configured with v8 provider
- Test environment: Node.js
- Global test functions enabled

## Claude Data Architecture

The application reads Claude Code usage data from `~/.claude/projects/` directory:

- **Data Source**: JSONL files in project-specific directories
- **Data Processing**: 
  - Parses Claude log entries with usage information
  - Aggregates token usage (input, output, cache) by date
  - Calculates costs based on model type (Sonnet vs Opus)
  - Fills missing days with zero values for consistent 30-day display
- **Key Types**:
  - `ClaudeLogEntry`: Raw log entry structure from JSONL files
  - `DailyUsage`: Aggregated daily usage with tokens and cost
  - `TOKEN_PRICES`: Current Anthropic pricing constants

## React Ink UI Pattern

- **Entry Point**: `index.tsx` renders `<App>` component
- **State Management**: React hooks for loading, error, and data states
- **Data Flow**: App loads data → UsageGraph displays chart
- **Debug Mode**: `--debug` flag enables verbose console output to stderr