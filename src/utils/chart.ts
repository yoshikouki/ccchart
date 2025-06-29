/**
 * グラフ描画に関する純粋関数を提供
 * asciichartのラッパーとして、決定的で再現可能な出力を保証
 */

export interface ChartOptions {
  height: number;
  offset: number;
  padding: string;
  format?: (value: number, index: number) => string;
}

export interface ChartLine {
  label: string;
  symbol: string;
  value: number;
}

/**
 * Y軸ラベルの最大幅を計算
 */
export function calculateMaxLabelWidth(
  values: number[],
  format: (value: number, index: number) => string,
): number {
  if (values.length === 0) return 0;

  const max = Math.max(...values);
  const min = Math.min(...values);

  // すべての可能なラベルを生成して最大幅を見つける
  const labels: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const value = max - (i * (max - min)) / 12;
    labels.push(format(value, i));
  }

  return Math.max(...labels.map((l) => l.length));
}

/**
 * グラフのY軸スケールを生成
 */
export function generateYScale(
  data: number[],
  height: number,
  format: (value: number, index: number) => string,
): ChartLine[] {
  if (data.length === 0) {
    return Array.from({ length: height + 1 }, (_, i) => ({
      label: format(0, i),
      symbol: i === height ? "┼" : "┤",
      value: 0,
    }));
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const lines: ChartLine[] = [];
  for (let i = 0; i <= height; i++) {
    const value = range === 0 ? max : max - (i * range) / height;
    lines.push({
      label: format(value, i),
      symbol: i === height ? "┼" : "┤",
      value,
    });
  }

  return lines;
}

/**
 * チャートの左パディングを正規化
 * すべてのY軸ラベルが同じ位置で終わるようにする
 */
export function normalizeChartPadding(
  lines: ChartLine[],
  padding: string,
  maxLabelWidth: number,
): string[] {
  return lines.map((line) => {
    const paddedLabel = line.label.padStart(maxLabelWidth);
    return `${padding}${paddedLabel} ${line.symbol}`;
  });
}

/**
 * asciichartの出力を解析してY軸を修正
 */
export function fixChartAlignment(
  chartOutput: string,
  data: number[],
  options: ChartOptions,
): string {
  const lines = chartOutput.split("\n");
  const format = options.format || ((x: number) => x.toString());

  // Y軸ラベルの最大幅を計算
  const maxLabelWidth = calculateMaxLabelWidth(data, format);

  // Y軸スケールを生成
  const yScale = generateYScale(data, options.height, format);

  // 各行を処理
  const fixedLines = lines.map((line, index) => {
    // Y軸ラベルを含む行かチェック
    if (line.includes("┤") || line.includes("┼")) {
      // 対応するY軸情報を取得
      const scaleIndex = Math.min(index, yScale.length - 1);
      const scaleLine = yScale[scaleIndex];

      if (scaleLine) {
        // Y軸ラベル部分を再構築
        const paddedLabel = scaleLine.label.padStart(maxLabelWidth);

        // グラフ部分を抽出（元の行から軸記号以降を取得）
        const graphPartMatch = line.match(/[┤┼](.*)$/);
        const graphPart = graphPartMatch ? graphPartMatch[0] : scaleLine.symbol;

        return `${options.padding}${paddedLabel} ${graphPart}`;
      }
    }

    return line;
  });

  return fixedLines.join("\n");
}

/**
 * X軸ラベルを生成
 */
export function generateXAxisLabels(
  data: Array<{ date: string }>,
  _chartWidth: number,
): string {
  if (data.length === 0) return "";

  const totalWidth = data.length;
  const labelPositions = [
    0,
    Math.floor(totalWidth / 3),
    Math.floor((totalWidth * 2) / 3),
    totalWidth - 1,
  ];

  let labelLine = "";
  let lastLabelEnd = 0;

  labelPositions.forEach((pos) => {
    if (pos >= data.length) return;

    const date = new Date(data[pos]?.date || "");
    const label = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
      date.getDate(),
    ).padStart(2, "0")}`;

    // 前のラベルの終了位置から現在のラベル位置まで空白で埋める
    const spacesToAdd = pos - lastLabelEnd;
    labelLine += " ".repeat(Math.max(0, spacesToAdd));

    // ラベルを追加
    labelLine += label;
    lastLabelEnd = pos + label.length;
  });

  return labelLine;
}
