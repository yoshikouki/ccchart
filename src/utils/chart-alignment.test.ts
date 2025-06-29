import { describe, expect, it } from "vitest";
import { fixChartAlignment } from "./chart";

describe("chart alignment - Y軸整列の包括的テスト", () => {
  it("すべての金額が異なる桁数でも整列する", () => {
    const testCases = [
      {
        name: "小数点以下の値",
        chart: ["  $0.50 ┤ ╭─", "  $0.25 ┤─╯", "  $0.00 ┼"].join("\n"),
        data: [0.0, 0.25, 0.5],
      },
      {
        name: "整数と小数の混在",
        chart: [" $100.00 ┤  ╭─", "  $50.50 ┤ ╭╯", "   $1.00 ┤─╯", "   $0.00 ┼"].join("\n"),
        data: [1.0, 50.5, 100.0, 0.0],
      },
      {
        name: "大きな値",
        chart: [
          " $10000.00 ┤   ╭",
          "  $5000.00 ┤  ╭╯",
          "  $1000.00 ┤ ╭╯",
          "    $0.00 ┼─╯",
        ].join("\n"),
        data: [0, 1000, 5000, 10000],
      },
    ];

    testCases.forEach((testCase) => {
      const options = {
        height: testCase.data.length - 1,
        offset: 3,
        padding: "  ",
        format: (x: number) => `$${x.toFixed(2)}`,
      };

      const fixed = fixChartAlignment(testCase.chart, testCase.data, options);
      const lines = fixed.split("\n");

      // 各行の軸記号位置を確認
      const positions = lines.map((line) => {
        const idx1 = line.indexOf("┤");
        const idx2 = line.indexOf("┼");
        return idx1 !== -1 ? idx1 : idx2;
      });

      // すべての位置が同じであることを確認
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(1);

      // 位置が-1（見つからない）でないことを確認
      expect(positions[0]).toBeGreaterThan(-1);
    });
  });

  it("異なるパディングでも正しく整列する", () => {
    const chart = [" $100.00 ┤ ╭─", "  $50.00 ┤─╯", "   $0.00 ┼"].join("\n");

    const paddingTests = ["", " ", "    ", "        "];
    const data = [0, 50, 100];

    paddingTests.forEach((padding) => {
      const options = {
        height: 2,
        offset: 3,
        padding,
        format: (x: number) => `$${x.toFixed(2)}`,
      };

      const fixed = fixChartAlignment(chart, data, options);
      const lines = fixed.split("\n");

      const positions = lines.map((line) => {
        const idx1 = line.indexOf("┤");
        const idx2 = line.indexOf("┼");
        return idx1 !== -1 ? idx1 : idx2;
      });

      expect(new Set(positions).size).toBe(1);
    });
  });

  it("負の値でも正しく整列する", () => {
    const chart = ["  $100.00 ┤  ╭", "   $50.00 ┤ ╭╯", "    $0.00 ┤─╯", "  $-50.00 ┼"].join(
      "\n",
    );

    const data = [-50, 0, 50, 100];
    const options = {
      height: 3,
      offset: 3,
      padding: "  ",
      format: (x: number) => `$${x.toFixed(2)}`,
    };

    const fixed = fixChartAlignment(chart, data, options);
    const lines = fixed.split("\n");

    const positions = lines.map((line) => {
      const idx1 = line.indexOf("┤");
      const idx2 = line.indexOf("┼");
      return idx1 !== -1 ? idx1 : idx2;
    });

    expect(new Set(positions).size).toBe(1);
  });

  it("同じ値が続く場合でも正しく整列する", () => {
    const chart = [" $50.00 ┤ ────", " $50.00 ┤", " $50.00 ┼"].join("\n");

    const data = [50, 50, 50];
    const options = {
      height: 2,
      offset: 3,
      padding: " ",
      format: (x: number) => `$${x.toFixed(2)}`,
    };

    const fixed = fixChartAlignment(chart, data, options);
    const lines = fixed.split("\n");

    const positions = lines.map((line) => {
      const idx1 = line.indexOf("┤");
      const idx2 = line.indexOf("┼");
      return idx1 !== -1 ? idx1 : idx2;
    });

    expect(new Set(positions).size).toBe(1);
  });

  it("空のデータでも処理が失敗しない", () => {
    const chart = " $0.00 ┼";
    const data: number[] = [];
    const options = {
      height: 0,
      offset: 3,
      padding: " ",
      format: (x: number) => `$${x.toFixed(2)}`,
    };

    expect(() => {
      fixChartAlignment(chart, data, options);
    }).not.toThrow();
  });

  it("極端に長いフォーマット文字列でも整列する", () => {
    const chart = [
      " Total Cost: $1234.56 USD ┤ ╭",
      " Total Cost: $617.28 USD ┤─╯",
      " Total Cost: $0.00 USD ┼",
    ].join("\n");

    const data = [0, 617.28, 1234.56];
    const options = {
      height: 2,
      offset: 3,
      padding: " ",
      format: (x: number) => `Total Cost: $${x.toFixed(2)} USD`,
    };

    const fixed = fixChartAlignment(chart, data, options);
    const lines = fixed.split("\n");

    const positions = lines.map((line) => {
      const idx1 = line.indexOf("┤");
      const idx2 = line.indexOf("┼");
      return idx1 !== -1 ? idx1 : idx2;
    });

    expect(new Set(positions).size).toBe(1);
  });
});
