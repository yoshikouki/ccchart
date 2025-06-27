import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { ClaudeLogEntry, DailyUsage } from "../types/claudeData.js";
import { TOKEN_PRICES } from "../types/claudeData.js";

/**
 * 現在のディレクトリパスからClaude Codeプロジェクト名を生成
 */
export function getProjectNameFromPath(projectPath: string): string {
  const normalizedPath = resolve(projectPath);
  // ルートの "/" を除去してから変換
  const pathWithoutRoot = normalizedPath.startsWith("/")
    ? normalizedPath.slice(1)
    : normalizedPath;
  // ドット（.）をハイフン（-）に変換してClaudeディレクトリ命名規則に合わせる
  return `-${pathWithoutRoot.replace(/[/.]/g, "-")}`;
}

/**
 * Claude Codeプロジェクトディレクトリのパスを取得
 */
export function getClaudeProjectDir(projectPath: string): string {
  const claudeDir = join(homedir(), ".claude", "projects");
  const projectName = getProjectNameFromPath(projectPath);
  return join(claudeDir, projectName);
}

/**
 * プロジェクトディレクトリが存在するかチェック
 */
export async function checkProjectExists(projectPath: string): Promise<boolean> {
  try {
    const projectDir = getClaudeProjectDir(projectPath);
    const stats = await stat(projectDir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * JSONLファイルのリストを取得
 */
export async function getJsonlFiles(projectPath: string): Promise<string[]> {
  const projectDir = getClaudeProjectDir(projectPath);
  const files = await readdir(projectDir);
  return files.filter((file) => file.endsWith(".jsonl")).map((file) => join(projectDir, file));
}

/**
 * JSONLファイルを読み込んでパース
 */
export async function parseJsonlFile(filePath: string): Promise<ClaudeLogEntry[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  const entries: ClaudeLogEntry[] = [];
  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as ClaudeLogEntry;
      entries.push(entry);
    } catch (_error) {
      console.warn(`Invalid JSON line in ${filePath}:`, line.slice(0, 100));
    }
  }

  return entries;
}

/**
 * ログエントリから日別使用量データを集計
 */
export function aggregateDailyUsage(entries: ClaudeLogEntry[]): DailyUsage[] {
  const dailyMap = new Map<string, DailyUsage>();

  for (const entry of entries) {
    // assistantメッセージのみ使用量を集計（userメッセージは通常usageがない）
    if (entry.type !== "assistant" || !entry.message.usage) {
      continue;
    }

    const timestamp = entry.timestamp;
    if (!timestamp) {
      continue; // timestampがない場合はスキップ
    }
    const date = new Date(timestamp).toISOString().split("T")[0] as string; // YYYY-MM-DD
    const usage = entry.message.usage;

    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // コスト計算（Claude 3.5 Sonnet価格を使用）
    const cost =
      inputTokens * TOKEN_PRICES.SONNET_INPUT + outputTokens * TOKEN_PRICES.SONNET_OUTPUT;

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        messageCount: 0,
      });
    }

    const dailyUsage = dailyMap.get(date);
    if (!dailyUsage) {
      continue;
    }
    dailyUsage.inputTokens += inputTokens;
    dailyUsage.outputTokens += outputTokens;
    dailyUsage.totalTokens += totalTokens;
    dailyUsage.cost += cost;
    dailyUsage.messageCount += 1;
  }

  // 日付順でソート
  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * プロジェクトの全使用量データを取得
 */
export async function getProjectUsageData(projectPath: string): Promise<DailyUsage[]> {
  const exists = await checkProjectExists(projectPath);
  if (!exists) {
    throw new Error(`Claude Code project not found for path: ${projectPath}`);
  }

  const jsonlFiles = await getJsonlFiles(projectPath);
  if (jsonlFiles.length === 0) {
    return [];
  }

  const allEntries: ClaudeLogEntry[] = [];
  for (const file of jsonlFiles) {
    try {
      const entries = await parseJsonlFile(file);
      allEntries.push(...entries);
    } catch (error) {
      console.warn(`Failed to parse ${file}:`, error);
    }
  }

  return aggregateDailyUsage(allEntries);
}
