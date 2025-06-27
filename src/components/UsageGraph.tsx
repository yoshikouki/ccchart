import { plot } from "asciichart";
import { Box, Text } from "ink";
import type React from "react";

interface UsageData {
  date: string;
  tokens: number;
  cost: number;
}

interface UsageGraphProps {
  data: UsageData[];
}

export const UsageGraph: React.FC<UsageGraphProps> = ({ data }) => {
  const tokenData = data.map((d) => d.tokens);
  const costData = data.map((d) => d.cost);

  const tokenChart = plot(tokenData, {
    height: 8,
    padding: "      ",
    colors: ["\x1b[36m"], // cyan
    format: (x: number) => `${(x / 1000).toFixed(1)}k`,
  });

  const costChart = plot(costData, {
    height: 6,
    padding: "      ",
    colors: ["\x1b[32m"], // green
    format: (x: number) => `$${x.toFixed(2)}`,
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="cyan" bold>
        📈 日別トークン使用量
      </Text>
      <Text>{tokenChart}</Text>

      <Box marginTop={1}>
        <Text color="green" bold>
          💰 日別コスト ($)
        </Text>
      </Box>
      <Text>{costChart}</Text>

      <Box marginTop={1}>
        <Text color="gray">
          期間: {data[0]?.date} 〜 {data[data.length - 1]?.date}
        </Text>
      </Box>
    </Box>
  );
};
