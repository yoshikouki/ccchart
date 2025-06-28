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
    offset: 3,
    padding: "       ",
    colors: ["\x1b[32m"], // green
    format: (x: number) => `$${x.toFixed(2)}`,
  });

  // X軸ラベル用の日付を生成
  const generateXAxisLabels = () => {
    const totalWidth = data.length;
    const labelPositions = [0, Math.floor(totalWidth / 3), Math.floor((totalWidth * 2) / 3), totalWidth - 1];
    
    let labelLine = "";
    let lastLabelEnd = 0;
    
    labelPositions.forEach((pos, index) => {
      if (pos >= data.length) return;
      
      const date = new Date(data[pos].date);
      const label = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
      
      // 前のラベルの終了位置から現在のラベル位置まで空白で埋める
      const spacesToAdd = pos - lastLabelEnd;
      labelLine += " ".repeat(Math.max(0, spacesToAdd));
      
      // ラベルを追加
      labelLine += label;
      lastLabelEnd = pos + label.length;
    });
    
    return `       ${labelLine}`; // offsetに合わせて左側にパディング
  };

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="green" bold>
        💰 日別コスト (過去30日)
      </Text>
      <Text>{costChart}</Text>
      <Text color="gray">{generateXAxisLabels()}</Text>

      <Box marginTop={1}>
        <Text color="gray">
          期間: {data[0]?.date} 〜 {data[data.length - 1]?.date}
        </Text>
      </Box>
    </Box>
  );
};
