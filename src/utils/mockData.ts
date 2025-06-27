import { generateLast30Days } from "./claudeDataReader.js";

function generateMockDataForDate(date: string, _index: number) {
  // 基本的な使用量パターン（平日は多め、週末は少なめ）
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // ランダムな変動を加える
  const baseAmount = isWeekend ? 0.05 : 0.25;
  const variation = Math.random() * 0.3;
  const cost = Math.max(0, baseAmount + variation - 0.1);

  // 時々大きなスパイクを入れる（10%の確率）
  const hasSpike = Math.random() < 0.1;
  const finalCost = hasSpike ? cost + Math.random() * 1.5 : cost;

  return {
    date,
    tokens: Math.round(finalCost * 50000), // トークン数は適当に計算
    cost: Math.round(finalCost * 100) / 100, // 小数点2桁
  };
}

// モックデータ - 過去30日間の使用量データ風のサンプル
export const mockUsageData = generateLast30Days().map(generateMockDataForDate);
