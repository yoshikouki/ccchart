import { spawn } from "node:child_process";
import type { DailyUsage } from "../types/claudeData.js";

/**
 * ccusageの出力データ構造
 */
interface CcusageDailyData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: Array<{
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    cost: number;
  }>;
}

interface CcusageOutput {
  daily: CcusageDailyData[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    totalCost: number;
    totalTokens: number;
  };
}

/**
 * ccusageコマンドを実行してJSONデータを取得
 */
export async function getCcusageData(debugMode = false): Promise<CcusageOutput> {
  return new Promise((resolve, reject) => {
    const process = spawn("bunx", ["ccusage@latest", "--json"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
      if (debugMode) {
        console.error("ccusage stderr:", data.toString());
      }
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ccusage command failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        const data = JSON.parse(stdout) as CcusageOutput;
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse ccusage JSON output: ${error}`));
      }
    });

    process.on("error", (error) => {
      reject(new Error(`Failed to execute ccusage command: ${error.message}`));
    });
  });
}

/**
 * ccusageのデータをccchartのDailyUsage形式に変換
 */
export function convertCcusageToDaily(ccusageData: CcusageOutput): DailyUsage[] {
  return ccusageData.daily.map((item) => ({
    date: item.date,
    inputTokens: item.inputTokens,
    outputTokens: item.outputTokens,
    totalTokens: item.totalTokens,
    cost: item.totalCost,
    messageCount: 0, // ccusageにはメッセージ数がないため0に設定
  }));
}

/**
 * 過去30日間の日付範囲を生成（今日を含む）
 */
function generateLast30Days(): string[] {
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
function fillMissingDays(usage: DailyUsage[]): DailyUsage[] {
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
 * ccusageから過去30日間の使用量データを取得
 */
export async function getCcusageUsageData(debugMode = false): Promise<DailyUsage[]> {
  try {
    const ccusageData = await getCcusageData(debugMode);
    const dailyUsage = convertCcusageToDaily(ccusageData);

    if (debugMode) {
      console.error(`📊 ccusage: ${dailyUsage.length} days of data`);
    }

    return fillMissingDays(dailyUsage);
  } catch (error) {
    console.warn("Failed to get ccusage data:", error);
    return fillMissingDays([]);
  }
}
