import { Box, Text } from "ink";
import { UsageGraph } from "./components/UsageGraph.js";
import { mockUsageData } from "./utils/mockData.js";

export const App = () => {
  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>
        📊 ccgraph - Claude Code Usage Graph
      </Text>
      <Text>Claude Code の使用量をグラフで表示します</Text>

      <UsageGraph data={mockUsageData} />
    </Box>
  );
};
