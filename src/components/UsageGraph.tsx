import { plot } from "asciichart";
import { Box, Text } from "ink";
import type React from "react";
import { fixChartAlignment, generateXAxisLabels } from "../utils/chart";

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

  // グラフ描画オプション
  const chartOptions = {
    height: 12,
    offset: 3,
    padding: "        ",
    colors: ["\x1b[32m"], // green
    format: (x: number, _i: number) => `$${x.toFixed(2)}`,
  };

  // asciichartで基本的なグラフを生成
  const rawChart = plot(costData, chartOptions);

  // Y軸の整列を修正
  const alignedChart = fixChartAlignment(rawChart, costData, chartOptions);

  // X軸ラベルを生成（グラフの実際の幅に基づいて）
  const chartLines = alignedChart.split("\n");
  const chartWidth = chartLines[0] ? chartLines[0].length - chartOptions.padding.length : 50;
  const xAxisLabels = generateXAxisLabels(data, chartWidth);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="green" bold>
        💰 日別コスト (過去30日)
      </Text>
      <Text>{alignedChart}</Text>
      <Text color="gray">
        {chartOptions.padding}
        {xAxisLabels}
      </Text>

      <Box marginTop={1}>
        <Text color="gray">
          期間: {data[0]?.date} 〜 {data[data.length - 1]?.date}
        </Text>
      </Box>
    </Box>
  );
};
