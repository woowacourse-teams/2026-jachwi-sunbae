import type { Candidate } from './calibration-judge.mjs';

export type PlanItem = { action: 'create' | 'duplicate' | 'ignore' | 'unknown'; reason: string; candidate: Candidate };

export const TEAM_REPO: string;
export const planIssues: (candidates: Candidate[], existingKeys: Set<string> | null) => PlanItem[];
export const renderPlan: (plan: PlanItem[], options: { publish: boolean; author: string | null }) => string;
