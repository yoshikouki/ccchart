import { describe, expect, it } from "vitest";
import {
  calculateMaxLabelWidth,
  fixChartAlignment,
  generateXAxisLabels,
  generateYScale,
  normalizeChartPadding,
} from "./chart";

describe("chart utilities", () => {
  describe("calculateMaxLabelWidth", () => {
    it("0の場合の幅を正しく計算する", () => {
      const format = (x: number) => `$${x.toFixed(2)}`;
      const width = calculateMaxLabelWidth([0], format);
      expect(width).toBe(5); // "$0.00"
    });

    it("小数を含む値の最大幅を計算する", () => {
      const format = (x: number) => `$${x.toFixed(2)}`;
      const width = calculateMaxLabelWidth([0.5, 15.75, 32.19], format);
      expect(width).toBe(6); // "$32.19"
    });

    it("大きな値の最大幅を計算する", () => {
      const format = (x: number) => `$${x.toFixed(2)}`;
      const width = calculateMaxLabelWidth([100, 500, 1000], format);
      expect(width).toBe(8); // "$1000.00"
    });

    it("空配列の場合は0を返す", () => {
      const format = (x: number) => `$${x.toFixed(2)}`;
      const width = calculateMaxLabelWidth([], format);
      expect(width).toBe(0);
    });
  });

  describe("generateYScale", () => {
    it("正しいY軸スケールを生成する", () => {
      const format = (x: number) => `$${x.toFixed(2)}`;
      const scale = generateYScale([0, 50, 100], 4, format);

      expect(scale).toHaveLength(5);
      expect(scale[0]?.label).toBe("$100.00");
      expect(scale[0]?.symbol).toBe("┤");
      expect(scale[0]?.value).toBe(100);
      expect(scale[1]?.value).toBe(75);
      expect(scale[2]?.value).toBe(50);
      expect(scale[3]?.value).toBe(25);
      expect(scale[4]?.value).toBe(0);
      expect(scale[4]?.symbol).toBe("┼");
    });

    it("単一値でも正しく動作する", () => {
      const format = (x: number) => `$${x.toFixed(2)}`;
      const scale = generateYScale([50], 2, format);

      expect(scale).toHaveLength(3);
      expect(scale[0]?.value).toBe(50);
      expect(scale[1]?.value).toBe(50);
      expect(scale[2]?.value).toBe(50);
    });

    it("空配列でも正しく動作する", () => {
      const format = (x: number) => `$${x.toFixed(2)}`;
      const scale = generateYScale([], 2, format);

      expect(scale).toHaveLength(3);
      expect(scale.every((s) => s.value === 0)).toBe(true);
    });
  });

  describe("normalizeChartPadding", () => {
    it("すべての行を同じ幅に揃える", () => {
      const lines = [
        { label: "$100.00", symbol: "┤", value: 100 },
        { label: "$50.00", symbol: "┤", value: 50 },
        { label: "$0.00", symbol: "┼", value: 0 },
      ];

      const normalized = normalizeChartPadding(lines, "  ", 7);

      expect(normalized[0]).toBe("  $100.00 ┤");
      expect(normalized[1]).toBe("   $50.00 ┤");
      expect(normalized[2]).toBe("    $0.00 ┼");

      // すべての行で軸記号の位置が同じことを確認
      const positions = normalized.map((line) => {
        const idx1 = line.indexOf("┤");
        const idx2 = line.indexOf("┼");
        return idx1 !== -1 ? idx1 : idx2;
      });
      expect(new Set(positions).size).toBe(1);
    });
  });

  describe("fixChartAlignment", () => {
    it("Y軸の整列を修正する", () => {
      const mockChart = [
        " $32.19  ┤ ╭╮",
        " $20.00  ┤ ││",
        " $10.00  ┤╭╯│",
        " $0.00  ┼──╯",
      ].join("\n");

      const fixed = fixChartAlignment(mockChart, [0, 10, 32.19], {
        height: 3,
        offset: 3,
        padding: " ",
        format: (x: number) => `$${x.toFixed(2)}`,
      });

      const lines = fixed.split("\n");

      // 軸記号の位置がすべて同じことを確認
      const positions = lines.map((line) => {
        const idx1 = line.indexOf("┤");
        const idx2 = line.indexOf("┼");
        return idx1 !== -1 ? idx1 : idx2;
      });

      expect(new Set(positions).size).toBe(1);
    });
  });

  describe("generateXAxisLabels", () => {
    it("30日分のデータに対して4つのラベルを生成する", () => {
      const data = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-06-${String(i + 1).padStart(2, "0")}`,
      }));

      const labels = generateXAxisLabels(data, 50);

      expect(labels).toContain("06/01");
      expect(labels).toContain("06/11"); // Math.floor(30/3) = 10, 0-indexed = 11日
      expect(labels).toContain("06/21"); // Math.floor(30*2/3) = 20, 0-indexed = 21日
      expect(labels).toContain("06/30");
    });

    it("空のデータで空文字列を返す", () => {
      const labels = generateXAxisLabels([], 50);
      expect(labels).toBe("");
    });

    it("単一データでも動作する", () => {
      const data = [{ date: "2025-06-15" }];
      const labels = generateXAxisLabels(data, 20);

      expect(labels).toContain("06/15");
    });
  });
});
