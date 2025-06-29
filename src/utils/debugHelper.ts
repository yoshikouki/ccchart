import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ClaudeLogEntry, DailyUsage } from "../types/claudeData.js";
import { TOKEN_PRICES } from "../types/claudeData.js";
import { getClaudeProjectDir, getProjectNameFromPath } from "./claudeDataReader.js";

export async function debugProjectPaths(projectPath: string) {
  const projectName = getProjectNameFromPath(projectPath);
  const projectDir = getClaudeProjectDir(projectPath);

  console.log("Debug Info:");
  console.log("  Project Path:", projectPath);
  console.log("  Generated Project Name:", projectName);
  console.log("  Expected Project Dir:", projectDir);

  try {
    const claudeProjectsDir = join(homedir(), ".claude", "projects");
    const allProjects = await readdir(claudeProjectsDir);
    const matchingProjects = allProjects.filter((name) => name.includes("ccchart"));
    console.log("  Available ccchart projects:", matchingProjects);
  } catch (error) {
    console.log("  Error reading projects dir:", error);
  }
}

export function debugCostCalculation(entry: ClaudeLogEntry) {
  if (entry.type !== "assistant" || !entry.message.usage) {
    return null;
  }

  const usage = entry.message.usage;
  const model = entry.message.model || "claude-sonnet";
  const isOpus = model.includes("opus");

  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
  const cacheReadTokens = usage.cache_read_input_tokens || 0;

  let cost = 0;
  const breakdown = {
    inputCost: 0,
    outputCost: 0,
    cacheCreationCost: 0,
    cacheReadCost: 0,
  };

  if (isOpus) {
    breakdown.inputCost = inputTokens * TOKEN_PRICES.OPUS_INPUT;
    breakdown.outputCost = outputTokens * TOKEN_PRICES.OPUS_OUTPUT;
    breakdown.cacheCreationCost = cacheCreationTokens * TOKEN_PRICES.OPUS_CACHE_WRITE;
    breakdown.cacheReadCost = cacheReadTokens * TOKEN_PRICES.OPUS_CACHE_READ;
  } else {
    breakdown.inputCost = inputTokens * TOKEN_PRICES.SONNET_INPUT;
    breakdown.outputCost = outputTokens * TOKEN_PRICES.SONNET_OUTPUT;
    breakdown.cacheCreationCost = cacheCreationTokens * TOKEN_PRICES.SONNET_CACHE_WRITE;
    breakdown.cacheReadCost = cacheReadTokens * TOKEN_PRICES.SONNET_CACHE_READ;
  }

  cost =
    breakdown.inputCost +
    breakdown.outputCost +
    breakdown.cacheCreationCost +
    breakdown.cacheReadCost;

  return {
    timestamp: entry.timestamp,
    model,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      cacheCreation: cacheCreationTokens,
      cacheRead: cacheReadTokens,
    },
    cost,
    breakdown,
  };
}

export function debugDailyUsage(dailyUsage: DailyUsage, date: string) {
  if (dailyUsage.date !== date) return;

  console.log(`\n=== Debug for ${date} ===`);
  console.log(`Total cost: $${dailyUsage.cost.toFixed(4)}`);
  console.log(`Input tokens: ${dailyUsage.inputTokens}`);
  console.log(`Output tokens: ${dailyUsage.outputTokens}`);
  console.log(`Total tokens: ${dailyUsage.totalTokens}`);
  console.log(`Message count: ${dailyUsage.messageCount}`);
}
