import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { UsageGraph } from "./components/UsageGraph.js";
import type { DailyUsage } from "./types/claudeData.js";
import { getProjectUsageData } from "./utils/claudeDataReader.js";
import { mockUsageData } from "./utils/mockData.js";

interface UsageData {
  date: string;
  tokens: number;
  cost: number;
}

export const App = () => {
  const [data, setData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentDir = process.cwd();
        const claudeUsageData = await getProjectUsageData(currentDir);

        if (claudeUsageData.length === 0) {
          // 実データがない場合はモックデータを使用
          setIsUsingMockData(true);
          setData(mockUsageData);
        } else {
          // 実データを使用
          const convertedData = claudeUsageData.map((item: DailyUsage) => ({
            date: item.date,
            tokens: item.totalTokens,
            cost: item.cost,
          }));
          setData(convertedData);
        }
      } catch (err) {
        console.warn("Failed to load Claude Code data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsUsingMockData(true);
        setData(mockUsageData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>
          📊 ccgraph - Claude Code Usage Graph
        </Text>
        <Text color="yellow">Loading...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>
        📊 ccgraph - Claude Code Usage Graph
      </Text>
      <Text>Claude Code の使用量をグラフで表示します</Text>

      {error && <Text color="red">⚠️ Error: {error}</Text>}

      {isUsingMockData && (
        <Text color="yellow">📋 Using mock data (no Claude Code data found)</Text>
      )}

      <UsageGraph data={data} />
    </Box>
  );
};
