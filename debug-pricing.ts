#!/usr/bin/env bun
import { getAllProjectsUsageData, parseJsonlFile } from "./src/utils/claudeDataReader.js";
import { debugCostCalculation, debugDailyUsage } from "./src/utils/debugHelper.js";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const TARGET_DATE = "2025-06-28";

async function debugPricingDifference() {
  console.log("🔍 料金計算の差異を調査中...\n");

  try {
    // 全プロジェクトのデータを取得
    const allDailyUsage = await getAllProjectsUsageData();
    const targetDayUsage = allDailyUsage.find(day => day.date === TARGET_DATE);

    if (!targetDayUsage) {
      console.log(`❌ ${TARGET_DATE} のデータが見つかりませんでした`);
      return;
    }

    console.log(`📊 ${TARGET_DATE} の集計結果:`);
    console.log(`  総コスト: $${targetDayUsage.cost.toFixed(4)}`);
    console.log(`  総トークン: ${targetDayUsage.totalTokens.toLocaleString()}`);
    console.log(`  メッセージ数: ${targetDayUsage.messageCount}`);
    console.log("");

    // 詳細な分析のため、個別のエントリを確認
    console.log("🔍 詳細分析のため、個別ログエントリを確認中...\n");
    
    const claudeProjectsDir = join(homedir(), ".claude", "projects");
    const projectDirs = await readdir(claudeProjectsDir);
    
    let totalDebugCost = 0;
    let entriesFound = 0;
    let modelCounts: Record<string, number> = {};
    let tokenBreakdown = {
      input: 0,
      output: 0,
      cacheCreation: 0,
      cacheRead: 0,
    };

    for (const projectDir of projectDirs) {
      const fullProjectPath = join(claudeProjectsDir, projectDir);
      
      try {
        const files = await readdir(fullProjectPath);
        const jsonlFiles = files
          .filter((file) => file.endsWith(".jsonl"))
          .map((file) => join(fullProjectPath, file));

        for (const file of jsonlFiles) {
          try {
            const entries = await parseJsonlFile(file);
            
            for (const entry of entries) {
              if (entry.timestamp && entry.timestamp.startsWith(TARGET_DATE)) {
                const debug = debugCostCalculation(entry);
                if (debug) {
                  totalDebugCost += debug.cost;
                  entriesFound++;
                  
                  // モデル統計
                  modelCounts[debug.model] = (modelCounts[debug.model] || 0) + 1;
                  
                  // トークン統計
                  tokenBreakdown.input += debug.tokens.input;
                  tokenBreakdown.output += debug.tokens.output;
                  tokenBreakdown.cacheCreation += debug.tokens.cacheCreation;
                  tokenBreakdown.cacheRead += debug.tokens.cacheRead;
                  
                  // 詳細ログは最初の5件のみ表示
                  if (entriesFound <= 5) {
                    console.log(`📝 Entry ${entriesFound}: ${debug.model}`);
                    console.log(`   Time: ${debug.timestamp}`);
                    console.log(`   Input: ${debug.tokens.input}, Output: ${debug.tokens.output}`);
                    console.log(`   Cache Creation: ${debug.tokens.cacheCreation}, Cache Read: ${debug.tokens.cacheRead}`);
                    console.log(`   Cost: $${debug.cost.toFixed(6)}`);
                    console.log(`   Breakdown: Input $${debug.breakdown.inputCost.toFixed(6)}, Output $${debug.breakdown.outputCost.toFixed(6)}, Cache Create $${debug.breakdown.cacheCreationCost.toFixed(6)}, Cache Read $${debug.breakdown.cacheReadCost.toFixed(6)}`);
                    console.log("");
                  }
                }
              }
            }
          } catch (error) {
            // ファイル処理エラーは無視
          }
        }
      } catch (error) {
        // プロジェクト処理エラーは無視
      }
    }

    console.log("📊 集計結果:");
    console.log(`  対象エントリ数: ${entriesFound}`);
    console.log(`  計算済み総コスト: $${totalDebugCost.toFixed(4)}`);
    console.log(`  集計データとの差異: $${Math.abs(targetDayUsage.cost - totalDebugCost).toFixed(4)}`);
    console.log("");
    
    console.log("🤖 モデル別使用回数:");
    for (const [model, count] of Object.entries(modelCounts)) {
      console.log(`  ${model}: ${count}回`);
    }
    console.log("");
    
    console.log("🎯 トークン別集計:");
    console.log(`  Input: ${tokenBreakdown.input.toLocaleString()}`);
    console.log(`  Output: ${tokenBreakdown.output.toLocaleString()}`);
    console.log(`  Cache Creation: ${tokenBreakdown.cacheCreation.toLocaleString()}`);
    console.log(`  Cache Read: ${tokenBreakdown.cacheRead.toLocaleString()}`);
    console.log(`  Total: ${(tokenBreakdown.input + tokenBreakdown.output + tokenBreakdown.cacheCreation + tokenBreakdown.cacheRead).toLocaleString()}`);
    
    // ccusage との比較のため、計算方法を表示
    console.log("\n💡 料金計算の詳細:");
    console.log("現在の ccgraph の価格設定:");
    console.log("  Opus Input: $15/MTok, Output: $75/MTok");
    console.log("  Opus Cache Write: $18.75/MTok, Cache Read: $1.50/MTok");
    console.log("  Sonnet Input: $3/MTok, Output: $15/MTok");
    console.log("  Sonnet Cache Write: $3.75/MTok, Cache Read: $0.30/MTok");
    
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  }
}

debugPricingDifference();