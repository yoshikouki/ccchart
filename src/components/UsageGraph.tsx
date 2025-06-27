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
  const costData = data.map((d) => d.cost);

  const costChart = plot(costData, {
    height: 12,
    padding: "      ",
    colors: ["\x1b[32m"], // green
    format: (x: number) => `$${x.toFixed(2)}`,
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="green" bold>
        💰 日別コスト (過去30日)
      </Text>
      <Text>{costChart}</Text>

      <Box marginTop={1}>
        <Text color="gray">
          期間: {data[0]?.date} 〜 {data[data.length - 1]?.date}
        </Text>
      </Box>
    </Box>
  );
};
