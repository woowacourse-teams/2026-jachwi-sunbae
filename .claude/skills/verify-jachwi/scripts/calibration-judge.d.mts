import type { CalibrationRecord } from './calibration-history.mjs';

export type Suspect = { name: string; status: string; kind?: 'perf' | 'fix'; diff?: number; threshold?: number };
export type Suspects = { headCommit: string; baselineCommit: string | null; scenarios: Suspect[]; confirm: string[] };
export type ConfirmSide = {
  runs: number;
  success: number;
  environmentErrors: number;
  appErrors: number;
  errors: (string | null)[];
  values: number[];
  median: number | null;
};
export type ConfirmSummary = {
  baselineCommit: string;
  headCommit: string;
  rounds: number;
  scenarios: Record<string, { base: ConfirmSide; head: ConfirmSide }>;
};
export type Candidate = {
  key: string;
  kind: 'perf' | 'fix';
  scenario: string;
  channel: string;
  event: string;
  publishable: boolean;
  firstSeen: string;
  runs: string[];
  title: string;
  body: string;
};

export const REGRESSION: { relative: number; absolute: number };
export const CONFIRM_ROUNDS: number;
export const threshold: (base: number) => number;
export const findSuspects: (
  record: CalibrationRecord,
  history: CalibrationRecord[],
  options?: { mode?: 'auto' | 'always' | 'never' },
) => Suspects;
export const summarizeConfirm: (
  rowsBySide: { base: Record<string, unknown>[]; head: Record<string, unknown>[] },
  meta: { baselineCommit: string; headCommit: string; rounds: number },
) => ConfirmSummary;
export const decide: (
  suspect: Suspect,
  confirm: { base: ConfirmSide; head: ConfirmSide } | undefined,
) => { verdict: string; diff?: number; threshold?: number };
export const mergeCandidates: (
  store: { candidates: Record<string, Candidate> } | null,
  candidates: Candidate[],
) => { candidates: Record<string, Candidate> };
export const finalize: (
  record: CalibrationRecord,
  suspects: Suspects,
  confirm: ConfirmSummary | null,
  meta: { event: string },
) => { results: (Suspect & { verdict: string })[]; candidates: Candidate[] };
