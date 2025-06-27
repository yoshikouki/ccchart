// Claude Code のデータ構造定義

export interface UsageInfo {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | unknown[]; // assistantの場合は配列の場合がある
  usage?: UsageInfo;
  // assistant メッセージ特有のフィールド
  id?: string;
  type?: string;
  model?: string;
  stop_reason?: string | null;
  stop_sequence?: string | null;
  service_tier?: string;
}

export interface ClaudeLogEntry {
  type: "user" | "assistant" | "summary";
  uuid: string;
  timestamp: string; // ISO8601 format
  sessionId: string;
  parentUuid?: string | null;
  isSidechain: boolean;
  userType: string;
  cwd: string;
  version: string;
  message: ClaudeMessage;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD format
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  messageCount: number;
}

// トークン単価設定（USD）
export const TOKEN_PRICES = {
  // Claude 3.5 Sonnet
  SONNET_INPUT: 3 / 1_000_000, // $3 per 1M input tokens
  SONNET_OUTPUT: 15 / 1_000_000, // $15 per 1M output tokens
  // Claude 4 Opus
  OPUS_INPUT: 15 / 1_000_000, // $15 per 1M input tokens
  OPUS_OUTPUT: 75 / 1_000_000, // $75 per 1M output tokens
} as const;
