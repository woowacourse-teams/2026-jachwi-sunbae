export type ScenarioEntry = {
  version: number;
  label: string;
  runs: number;
  success: number;
  median: number | null;
  min: number | null;
  max: number | null;
  phases?: Record<string, number | null>;
  bytes?: { median: number | null };
  environmentErrors?: number;
  appErrors?: number;
  errors?: string[];
};

export type CalibrationRecord = {
  id: string;
  channel: 'prod' | 'test';
  createdAt: string;
  commit: string;
  runUrl: string;
  event?: string;
  env: Record<string, unknown> & { webview: string | null; android: string; abi: string; net: string };
  scenarios: Record<string, ScenarioEntry>;
};

export type ScenarioComparison = {
  scenario: string;
  previous: { commit: string; median: number | null; note: string | null } | null;
  recent: { count: number; median: number | null; commits: string[] };
  diffPrevious: number | null;
  diffRecent: number | null;
  flags: string[];
};

export const MIN_SUCCESS: number;
export const RECENT: number;
export const isSufficient: (entry: ScenarioEntry | undefined) => boolean;
export const compareScenario: (
  record: CalibrationRecord,
  history: CalibrationRecord[],
  scenario: string,
) => ScenarioComparison;
export const renderComparison: (record: CalibrationRecord, comparisons: ScenarioComparison[]) => string;
export const renderSummary: (channel: 'prod' | 'test', history: CalibrationRecord[]) => string;
