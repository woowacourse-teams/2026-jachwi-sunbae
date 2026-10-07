import { runPostHogAction } from './client';
import { classifyPostHogException } from './errorClassification';
export const capturePostHogException = (error: unknown, properties?: Record<string, unknown>): boolean =>
  runPostHogAction((client) => client.captureException(error, classifyPostHogException(error, properties)));
