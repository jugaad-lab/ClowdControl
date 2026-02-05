import { Task } from './supabase';

// Cost per 1M tokens for each model
export interface ModelRate {
  input: number;   // $ per 1M input tokens
  output: number;  // $ per 1M output tokens
}

export const MODEL_RATES: Record<string, ModelRate> = {
  'claude-opus-4-5':   { input: 15,   output: 75 },
  'claude-sonnet-4':   { input: 3,    output: 15 },
  'claude-sonnet-3.5': { input: 3,    output: 15 },
  'claude-haiku-3.5':  { input: 0.80, output: 4 },
};

// Cache multipliers relative to input rate
const CACHE_READ_MULTIPLIER = 0.10;   // 10% of input rate
const CACHE_WRITE_MULTIPLIER = 1.25;  // 125% of input rate

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cacheCost: number;
  totalCost: number;
}

/**
 * Calculate cost for a given token usage and model.
 * Falls back to claude-sonnet-4 rates if model is unknown.
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0,
): CostBreakdown {
  const rate = MODEL_RATES[model] ?? MODEL_RATES['claude-sonnet-4'];

  const inputCost = (inputTokens / 1_000_000) * rate.input;
  const outputCost = (outputTokens / 1_000_000) * rate.output;

  const cacheReadCost = (cacheReadTokens / 1_000_000) * rate.input * CACHE_READ_MULTIPLIER;
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * rate.input * CACHE_WRITE_MULTIPLIER;
  const cacheCost = cacheReadCost + cacheWriteCost;

  return {
    inputCost,
    outputCost,
    cacheCost,
    totalCost: inputCost + outputCost + cacheCost,
  };
}

/**
 * Format a dollar amount for display.
 */
export function formatCost(dollars: number): string {
  if (dollars < 0.01) return '<$0.01';
  if (dollars < 10) return `$${dollars.toFixed(2)}`;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Calculate cost for a Task object using its tokens_consumed field.
 * Uses a blended input/output split heuristic (80% input, 20% output)
 * since tasks only store total tokens_consumed.
 */
export function calculateTaskCost(
  task: Pick<Task, 'tokens_consumed'>,
  model: string = 'claude-sonnet-4',
): CostBreakdown {
  const total = task.tokens_consumed ?? 0;
  // Heuristic: ~80% of tokens are input, ~20% output
  const inputTokens = Math.round(total * 0.8);
  const outputTokens = total - inputTokens;
  return calculateCost(inputTokens, outputTokens, model);
}
