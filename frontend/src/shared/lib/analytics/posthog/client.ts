import { getPostHogOptions, isValidPostHogConfiguration } from './configuration';
import type { PostHogAction, PostHogClient } from './types';
type Configuration = { key: string; projectToken: string; host: string };
let requestedConfiguration: Configuration | null = null;
let initializedConfiguration: string | null = null;
let client: PostHogClient | null = null;
let loadPromise: Promise<void> | null = null;
let pendingActions: PostHogAction[] = [];
const MAX_PENDING_ACTIONS = 100;
let generation = 0;
const executeAction = (action: PostHogAction, loadedClient: PostHogClient): boolean => {
  try {
    action(loadedClient);
    return true;
  } catch {
    // 분석 SDK 오류가 로그인·저장 등 제품 동작을 실패시키면 안 된다.
    return false;
  }
};
const initializeClient = (loadedClient: PostHogClient): void => {
  const configuration = requestedConfiguration;
  if (configuration === null || initializedConfiguration === configuration.key) return;
  loadedClient.init(configuration.projectToken, getPostHogOptions(configuration.host));
  initializedConfiguration = configuration.key;
};
const flushActions = (loadedClient: PostHogClient): void => {
  const actions = pendingActions;
  pendingActions = [];
  actions.forEach((action) => executeAction(action, loadedClient));
};
const loadClient = (): void => {
  if (loadPromise !== null) return;
  const currentGeneration = generation;
  loadPromise = import('posthog-js')
    .then(({ default: loadedClient }) => {
      if (currentGeneration !== generation || requestedConfiguration === null) return;
      initializeClient(loadedClient);
      client = loadedClient;
      flushActions(loadedClient);
    })
    .catch(() => {
      // 일시적인 로딩 실패 후에도 큐를 보존하고 다음 수집 요청에서 다시 시도한다.
    })
    .finally(() => {
      if (currentGeneration === generation) loadPromise = null;
    });
};
export const initPostHog = (projectToken: string, host: string): boolean => {
  const normalizedToken = projectToken.trim();
  const normalizedHost = host.trim().replace(/\/$/, '');
  if (!isValidPostHogConfiguration(normalizedToken, normalizedHost)) {
    requestedConfiguration = null;
    pendingActions = [];
    return false;
  }
  const key = `${normalizedHost}:${normalizedToken}`;
  if (requestedConfiguration?.key !== key) pendingActions = [];
  requestedConfiguration = { key, projectToken: normalizedToken, host: normalizedHost };
  if (client === null) {
    loadClient();
    return true;
  }
  try {
    initializeClient(client);
    flushActions(client);
    return true;
  } catch {
    client = null;
    initializedConfiguration = null;
    return false;
  }
};
export const runPostHogAction = (action: PostHogAction): boolean => {
  if (requestedConfiguration === null) return false;
  if (client !== null && initializedConfiguration === requestedConfiguration.key) return executeAction(action, client);
  if (pendingActions.length >= MAX_PENDING_ACTIONS) return false;
  pendingActions.push(action);
  loadClient();
  return true;
};
export const resetPostHogClientForTests = (): void => {
  generation += 1;
  requestedConfiguration = null;
  initializedConfiguration = null;
  client = null;
  loadPromise = null;
  pendingActions = [];
};
