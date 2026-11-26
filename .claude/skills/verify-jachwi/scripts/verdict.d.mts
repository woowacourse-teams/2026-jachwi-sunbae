export type MetricComparison = {
  before: number[];
  after: number[];
  missingBefore: number;
  missingAfter: number;
  beforeMedian?: number;
  afterMedian?: number;
  diff?: number;
  spread?: number;
  threshold?: number;
  verdict: string;
};

export const JITTER_VERDICT: string;
export const compareMetric: (
  beforeValues: (number | null)[],
  afterValues: (number | null)[],
  options?: { spreadFactor?: number; minDiff?: number; maxSpread?: number },
) => MetricComparison;

export type MomentSummary = Pick<
  MetricComparison,
  'beforeMedian' | 'afterMedian' | 'diff' | 'spread' | 'threshold' | 'verdict'
>;
export type Recheck = { extraRuns: number; first: MomentSummary; combined: MomentSummary };
export type JudgeOptions = { spreadFactor?: number; minDiff?: number; maxSpread?: number };
export type RunRow = {
  variant: 'before' | 'after';
  run: number;
  moment: number | null;
  lcp: number | null;
  consoleErrors: string[];
  failedRequests: string[];
};

export const BORDERLINE: { low: number; high: number };
export const isBorderline: (metric: MetricComparison, range?: { low?: number; high?: number }) => boolean;
export const judgeWithRecheck: (
  rows: RunRow[],
  measureMore: (runs: number) => Promise<RunRow[]> | RunRow[],
  options?: JudgeOptions & { extraRuns?: number },
) => Promise<{ rows: RunRow[]; result: { moment: MetricComparison }; recheck: Recheck | null }>;
export const recheckLine: (recheck: Recheck) => string;
export const median: (values: number[]) => number;
