import { render } from "ink-testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsageGraph } from "./UsageGraph";

// chart utilsをモック
vi.mock("../utils/chart", () => ({
  fixChartAlignment: vi.fn((chart: string) => chart),
  generateXAxisLabels: vi.fn(() => "06/01           06/11           06/21          06/30"),
}));

// asciichartをモック化して決定的な出力を保証
vi.mock("asciichart", () => ({
  plot: vi.fn((_data: number[], _options: unknown) => {
    // 決定的なテスト用の固定出力
    const lines = [
      " $32.19 ┤                           ╭╮",
      " $29.51 ┤                           ││",
      " $26.83 ┤                          ╭╯│",
      " $24.15 ┤                          │ │",
      " $21.46 ┤                          │ │",
      " $18.78 ┤                          │ │",
      " $16.10 ┤  ╭╮                      │ │",
      " $13.41 ┤  ││               ╭╮    ╭╯ │",
      " $10.73 ┤  ││        ╭╮     ││    │  │",
      "  $8.05 ┤  │╰╮    ╭╮ ││ ╭╮  ││    │  │",
      "  $5.37 ┤  │ │    ││ ││ │╰╮╭╯│  ╭╮│  ╰",
      "  $2.68 ┤  │ │    ││ │╰─╯ ││ ╰╮╭╯││",
      "  $0.00 ┼──╯ ╰────╯╰─╯    ╰╯  ╰╯ ╰╯",
    ];
    return lines.join("\n");
  }),
}));

describe("UsageGraph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("基本的なグラフが正しくレンダリングされる", () => {
    const testData = [
      { date: "2025-06-01", tokens: 1000, cost: 10.0 },
      { date: "2025-06-02", tokens: 2000, cost: 20.0 },
      { date: "2025-06-03", tokens: 3000, cost: 30.0 },
    ];

    const { lastFrame } = render(<UsageGraph data={testData} />);
    const output = lastFrame();

    // 基本的な要素が含まれていることを確認
    expect(output).toContain("💰 日別コスト (過去30日)");
    expect(output).toContain("期間: 2025-06-01 〜 2025-06-03");
    expect(output).toContain("┤");
    expect(output).toContain("┼");
  });

  it("Y軸のすべての値が$記号で始まる", () => {
    const testData = [
      { date: "2025-06-01", tokens: 100, cost: 0.5 },
      { date: "2025-06-02", tokens: 1500, cost: 15.75 },
      { date: "2025-06-03", tokens: 3200, cost: 32.19 },
    ];

    const { lastFrame } = render(<UsageGraph data={testData} />);
    const output = lastFrame();

    const lines = output ? output.split("\n") : [];
    const chartLines = lines.filter((line) => line.includes("┤") || line.includes("┼"));

    chartLines.forEach((line) => {
      // 各行に$記号が含まれていることを確認
      expect(line).toMatch(/\$\d+\.\d{2}/);
    });
  });

  it("空のデータでもクラッシュしない", () => {
    const { lastFrame } = render(<UsageGraph data={[]} />);
    const output = lastFrame();

    expect(output).toBeDefined();
    expect(output).toContain("💰 日別コスト (過去30日)");
  });

  it("1つのデータポイントでも正しく表示される", () => {
    const testData = [{ date: "2025-06-15", tokens: 5000, cost: 50.0 }];

    const { lastFrame } = render(<UsageGraph data={testData} />);
    const output = lastFrame();

    expect(output).toContain("💰 日別コスト");
    expect(output).toContain("期間: 2025-06-15 〜 2025-06-15");
  });

  it("X軸ラベルが正しく表示される", () => {
    const testData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(2025, 5, i + 1);
      return {
        date: date.toISOString().split("T")[0] || "2025-06-01",
        tokens: Math.random() * 10000,
        cost: Math.random() * 100,
      };
    });

    const { lastFrame } = render(<UsageGraph data={testData} />);
    const output = lastFrame();

    // モックされたX軸ラベルが表示されることを確認
    expect(output).toContain("06/01");
    expect(output).toContain("06/30");
  });
});
