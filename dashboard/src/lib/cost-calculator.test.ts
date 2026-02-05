import { calculateCost, formatCost, calculateTaskCost, MODEL_RATES } from './cost-calculator';

describe('calculateCost', () => {
  it('calculates opus costs correctly', () => {
    const result = calculateCost(1_000_000, 1_000_000, 'claude-opus-4-5');
    expect(result.inputCost).toBe(15);
    expect(result.outputCost).toBe(75);
    expect(result.cacheCost).toBe(0);
    expect(result.totalCost).toBe(90);
  });

  it('calculates sonnet-4 costs correctly', () => {
    const result = calculateCost(1_000_000, 1_000_000, 'claude-sonnet-4');
    expect(result.inputCost).toBe(3);
    expect(result.outputCost).toBe(15);
    expect(result.totalCost).toBe(18);
  });

  it('calculates sonnet-3.5 costs correctly', () => {
    const result = calculateCost(1_000_000, 1_000_000, 'claude-sonnet-3.5');
    expect(result.inputCost).toBe(3);
    expect(result.outputCost).toBe(15);
    expect(result.totalCost).toBe(18);
  });

  it('calculates haiku costs correctly', () => {
    const result = calculateCost(1_000_000, 1_000_000, 'claude-haiku-3.5');
    expect(result.inputCost).toBeCloseTo(0.80);
    expect(result.outputCost).toBe(4);
    expect(result.totalCost).toBeCloseTo(4.80);
  });

  it('handles cache read tokens (10% of input rate)', () => {
    const result = calculateCost(0, 0, 'claude-sonnet-4', 1_000_000);
    // cache read = 1M * $3/1M * 0.10 = $0.30
    expect(result.cacheCost).toBeCloseTo(0.30);
    expect(result.totalCost).toBeCloseTo(0.30);
  });

  it('handles cache write tokens (125% of input rate)', () => {
    const result = calculateCost(0, 0, 'claude-sonnet-4', 0, 1_000_000);
    // cache write = 1M * $3/1M * 1.25 = $3.75
    expect(result.cacheCost).toBeCloseTo(3.75);
    expect(result.totalCost).toBeCloseTo(3.75);
  });

  it('handles combined cache read and write', () => {
    const result = calculateCost(500_000, 100_000, 'claude-sonnet-4', 200_000, 50_000);
    expect(result.inputCost).toBeCloseTo(1.50);
    expect(result.outputCost).toBeCloseTo(1.50);
    // cache read: 200K * $3/1M * 0.10 = $0.06
    // cache write: 50K * $3/1M * 1.25 = $0.1875
    expect(result.cacheCost).toBeCloseTo(0.2475);
    expect(result.totalCost).toBeCloseTo(3.2475);
  });

  it('falls back to sonnet-4 rates for unknown models', () => {
    const result = calculateCost(1_000_000, 1_000_000, 'unknown-model');
    expect(result.inputCost).toBe(3);
    expect(result.outputCost).toBe(15);
  });

  it('handles zero tokens', () => {
    const result = calculateCost(0, 0, 'claude-opus-4-5');
    expect(result.totalCost).toBe(0);
  });
});

describe('formatCost', () => {
  it('formats small amounts', () => {
    expect(formatCost(0.005)).toBe('<$0.01');
  });

  it('formats cent-level amounts', () => {
    expect(formatCost(0.42)).toBe('$0.42');
  });

  it('formats dollar amounts', () => {
    expect(formatCost(1.23)).toBe('$1.23');
  });

  it('formats larger amounts', () => {
    expect(formatCost(15.00)).toBe('$15.00');
  });

  it('formats zero', () => {
    expect(formatCost(0)).toBe('<$0.01');
  });
});

describe('calculateTaskCost', () => {
  it('calculates cost from tokens_consumed using 80/20 split', () => {
    const task = { tokens_consumed: 1_000_000 };
    const result = calculateTaskCost(task, 'claude-sonnet-4');
    // 800K input: 800K * $3/1M = $2.40
    // 200K output: 200K * $15/1M = $3.00
    expect(result.inputCost).toBeCloseTo(2.40);
    expect(result.outputCost).toBeCloseTo(3.00);
    expect(result.totalCost).toBeCloseTo(5.40);
  });

  it('defaults to sonnet-4 when no model specified', () => {
    const task = { tokens_consumed: 500_000 };
    const result = calculateTaskCost(task);
    // 400K input: 400K * $3/1M = $1.20
    // 100K output: 100K * $15/1M = $1.50
    expect(result.totalCost).toBeCloseTo(2.70);
  });

  it('handles zero tokens', () => {
    const task = { tokens_consumed: 0 };
    const result = calculateTaskCost(task);
    expect(result.totalCost).toBe(0);
  });
});

describe('MODEL_RATES', () => {
  it('has rates for all expected models', () => {
    expect(MODEL_RATES['claude-opus-4-5']).toBeDefined();
    expect(MODEL_RATES['claude-sonnet-4']).toBeDefined();
    expect(MODEL_RATES['claude-sonnet-3.5']).toBeDefined();
    expect(MODEL_RATES['claude-haiku-3.5']).toBeDefined();
  });
});
