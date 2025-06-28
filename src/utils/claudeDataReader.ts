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
  const processedEntries = new Set<string>(); // 重複除去用

  for (const entry of entries) {
    // assistantメッセージのみ使用量を集計（userメッセージは通常usageがない）
    if (entry.type !== "assistant" || !entry.message.usage) {
      continue;
    }

    const timestamp = entry.timestamp;
    if (!timestamp) {
      continue; // timestampがない場合はスキップ
    }

    // 重複除去: UUID + timestamp でユニーク性を確保
    const entryKey = `${entry.uuid}-${timestamp}`;
    if (processedEntries.has(entryKey)) {
      console.warn(`Duplicate entry skipped: ${entryKey}`);
      continue;
    }
    processedEntries.add(entryKey);

    const date = new Date(timestamp).toISOString().split("T")[0] as string; // YYYY-MM-DD
    const usage = entry.message.usage;

    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
    const cacheReadTokens = usage.cache_read_input_tokens || 0;
    const totalTokens = inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens;

    // モデルに基づいてコスト計算
    const model = entry.message.model || "claude-sonnet";
    const isOpus = model.includes("opus");

    let cost = 0;
    if (isOpus) {
      cost = inputTokens * TOKEN_PRICES.OPUS_INPUT + outputTokens * TOKEN_PRICES.OPUS_OUTPUT;
      cost +=
        cacheCreationTokens * TOKEN_PRICES.OPUS_CACHE_WRITE +
        cacheReadTokens * TOKEN_PRICES.OPUS_CACHE_READ;
    } else {
      cost =
        inputTokens * TOKEN_PRICES.SONNET_INPUT + outputTokens * TOKEN_PRICES.SONNET_OUTPUT;
      cost +=
        cacheCreationTokens * TOKEN_PRICES.SONNET_CACHE_WRITE +
        cacheReadTokens * TOKEN_PRICES.SONNET_CACHE_READ;
    }

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
 * 過去30日間の日付範囲を生成（今日を含む）
 */
export function generateLast30Days(): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split("T")[0] as string);
  }

  return dates;
}

/**
 * 日別使用量データを過去30日間で補完
 */
export function fillMissingDays(usage: DailyUsage[]): DailyUsage[] {
  const dates = generateLast30Days();
  const usageMap = new Map(usage.map((item) => [item.date, item]));

  return dates.map((date) => {
    const existing = usageMap.get(date);
    if (existing) {
      return existing;
    }

    // データがない日は0で埋める
    return {
      date,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cost: 0,
      messageCount: 0,
    };
  });
}

/**
 * 過去30日間のデータのみをフィルタリング
 */
export function filterLast30Days(usage: DailyUsage[]): DailyUsage[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0] as string;

  return usage.filter((item) => item.date >= cutoffDate);
}

/**
 * 全プロジェクトの使用量データを取得
 */
export async function getAllProjectsUsageData(): Promise<DailyUsage[]> {
  const claudeProjectsDir = join(homedir(), ".claude", "projects");

  try {
    const projectDirs = await readdir(claudeProjectsDir);
    const allEntries: ClaudeLogEntry[] = [];

    for (const projectDir of projectDirs) {
      const fullProjectPath = join(claudeProjectsDir, projectDir);

      try {
        const projectStat = await stat(fullProjectPath);
        if (!projectStat.isDirectory()) continue;

        const files = await readdir(fullProjectPath);
        const jsonlFiles = files
          .filter((file) => file.endsWith(".jsonl"))
          .map((file) => join(fullProjectPath, file));

        for (const file of jsonlFiles) {
          try {
            const entries = await parseJsonlFile(file);
            allEntries.push(...entries);
          } catch (error) {
            console.warn(`Failed to parse ${file}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Failed to process project ${projectDir}:`, error);
      }
    }

    const allDailyUsage = aggregateDailyUsage(allEntries);
    const last30DaysUsage = filterLast30Days(allDailyUsage);
    return fillMissingDays(last30DaysUsage);
  } catch (error) {
    console.warn("Failed to access Claude projects directory:", error);
    return fillMissingDays([]);
  }
}

/**
 * プロジェクトの過去30日間の使用量データを取得
 */
export async function getProjectUsageData(projectPath: string): Promise<DailyUsage[]> {
  const exists = await checkProjectExists(projectPath);
  if (!exists) {
    return fillMissingDays([]); // プロジェクトが存在しない場合は空データで30日分返す
  }

  const jsonlFiles = await getJsonlFiles(projectPath);
  if (jsonlFiles.length === 0) {
    return fillMissingDays([]); // ファイルがない場合も30日分返す
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

  const allDailyUsage = aggregateDailyUsage(allEntries);
  const last30DaysUsage = filterLast30Days(allDailyUsage);
  return fillMissingDays(last30DaysUsage);
}
