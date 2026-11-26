export type FieldGroup = { platform: string; net: string; n: number; p50: number | null; p75: number | null; enough: boolean };
export const MIN_SAMPLES: number;
export const FIELD_QUERY: string;
export const summarizeField: (rows: (string | number)[][]) => {
  status: 'ok' | 'insufficient';
  minSamples: number;
  window: string;
  groups: FieldGroup[];
};
