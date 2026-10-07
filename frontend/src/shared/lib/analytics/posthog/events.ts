import { runPostHogAction } from './client';
let lastTrackedPath: string | null = null;
export const trackPostHogPageView = (path: string): boolean => {
  if (lastTrackedPath === path) return false;
  const accepted = runPostHogAction((client) => client.capture('$pageview', { path }));
  if (accepted) lastTrackedPath = path;
  return accepted;
};
export const trackPostHogEvent = (eventName: string, properties?: Record<string, unknown>): boolean =>
  runPostHogAction((client) => client.capture(eventName, properties));
export const resetPostHogPageView = (): void => {
  lastTrackedPath = null;
};
