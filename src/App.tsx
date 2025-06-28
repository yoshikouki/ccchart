import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { UsageGraph } from "./components/UsageGraph.js";
import type { DailyUsage } from "./types/claudeData.js";
import { getAllProjectsUsageData } from "./utils/claudeDataReader.js";

interface UsageData {
  date: string;
  tokens: number;
  cost: number;
}

interface AppProps {
  debugMode?: boolean;
}

export const App = ({ debugMode = false }: AppProps) => {
  const [data, setData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 全プロジェクトのデータを取得
        const claudeUsageData = await getAllProjectsUsageData(debugMode);

        // 実データを常に使用（30日分、データがない日は0で埋められる）
        const convertedData = claudeUsageData.map((item: DailyUsage) => ({
          date: item.date,
          tokens: item.totalTokens,
          cost: item.cost,
        }));
        setData(convertedData);
      } catch (err) {
        console.warn("Failed to load Claude Code data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // エラーの場合も空の30日データを表示
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [debugMode]);

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
      {error && <Text color="red">⚠️ Error: {error}</Text>}

      <UsageGraph data={data} />
    </Box>
  );
};
