import { isAdminScreen } from '../adminPrivacy';
import { getAnalyticsTrafficContext } from '../trafficContext';
import { getPostHogOptions, isValidPostHogConfiguration } from './configuration';
import type { PostHogAction, PostHogAuthStatus, PostHogClient, PostHogSessionContext } from './types';
type Configuration = { key: string; projectToken: string; host: string };
let requestedConfiguration: Configuration | null = null;
let initializedConfiguration: string | null = null;
let client: PostHogClient | null = null;
let loadPromise: Promise<void> | null = null;
let pendingActions: PostHogAction[] = [];
// 첫 화면 뒤로 SDK를 미루는 동안 쌓이는 이벤트(페이지뷰, 성능, 노출)를 버리지 않을 만큼 둔다.
const MAX_PENDING_ACTIONS = 300;
let generation = 0;
let loadHeld = false;
let loadHoldRequested = false;
let sessionContext: PostHogSessionContext | null = null;
let authenticationReader: (() => PostHogAuthStatus) | null = null;
export const setPostHogAuthenticationReader = (reader: () => PostHogAuthStatus): void => {
  authenticationReader = reader;
};
export const getPostHogEventProperties = (properties?: Record<string, unknown>): Record<string, unknown> => ({
  ...properties,
  ...sessionContext,
  ...(authenticationReader
    ? {
        auth_status: authenticationReader(),
        ...getAnalyticsTrafficContext(sessionContext?.environment),
      }
    : {}),
});
let identifiedMember: string | null = null;
let lastTrackedPath: string | null = null;
let status: 'disabled' | 'deferred' | 'loading' | 'ready' | 'failed' = 'disabled';
let failedActions = 0;
let droppedActions = 0;
const diagnoseFailure = (reason: 'sdk_action' | 'sdk_load' | 'queue_full'): void => {
  if (sessionContext?.environment === 'development') console.warn(`[analytics] ${reason}`);
};
export const getPostHogDiagnostics = () => ({
  status,
  pendingActions: pendingActions.length,
  failedActions,
  droppedActions,
});
const resetTrackingState = (): void => {
  sessionContext = null;
  identifiedMember = null;
  lastTrackedPath = null;
};
const executeAction = (action: PostHogAction, loadedClient: PostHogClient): boolean => {
  try {
    action(loadedClient);
    return true;
  } catch {
    // 분석 SDK 오류가 로그인·저장 등 제품 동작을 실패시키면 안 된다.
    failedActions += 1;
    diagnoseFailure('sdk_action');
    return false;
  }
};
const initializeClient = (loadedClient: PostHogClient): void => {
  const configuration = requestedConfiguration;
  if (configuration === null || initializedConfiguration === configuration.key) return;
  loadedClient.init(
    configuration.projectToken,
    getPostHogOptions(
      configuration.host,
      () => sessionContext,
      () => requestedConfiguration !== null,
      () => authenticationReader?.(),
    ),
  );
  initializedConfiguration = configuration.key;
};
const flushActions = (loadedClient: PostHogClient): void => {
  const actions = pendingActions;
  pendingActions = [];
  actions.forEach((action) => executeAction(action, loadedClient));
};
const loadClient = (): void => {
  if (loadPromise !== null) return;
  if (loadHeld) {
    status = 'deferred';
    return;
  }
  status = 'loading';
  const currentGeneration = generation;
  loadPromise = import('posthog-js')
    .then(({ default: loadedClient }) => {
      if (currentGeneration !== generation || requestedConfiguration === null) return;
      initializeClient(loadedClient);
      client = loadedClient;
      status = 'ready';
      flushActions(loadedClient);
    })
    .catch(() => {
      if (currentGeneration !== generation) return;
      status = 'failed';
      diagnoseFailure('sdk_load');
      // 일시적인 로딩 실패 후에도 큐를 보존하고 다음 수집 요청에서 다시 시도한다.
    })
    .finally(() => {
      if (currentGeneration === generation) loadPromise = null;
    });
};
/**
 * SDK 받기를 `ready`가 끝날 때까지 미룬다. 그동안의 액션은 지금처럼 큐에 모았다가 받은 뒤 순서대로 보낸다.
 * 첫 화면에서 SDK가 회선을 나눠 쓰지 않게 하려는 것이라, 앱 시작 때 한 번만 건다. 이미 받았거나 받는 중이면 걸지 않는다.
 */
export const holdPostHogSdkLoadUntil = (ready: Promise<unknown>): void => {
  if (loadHoldRequested || client !== null || loadPromise !== null) return;
  loadHoldRequested = true;
  loadHeld = true;
  const currentGeneration = generation;
  const release = () => {
    if (currentGeneration !== generation) return;
    loadHeld = false;
    if (requestedConfiguration !== null) loadClient();
  };
  ready.then(release, release);
};
export const isPostHogSdkReady = (): boolean => status === 'ready';
export const initPostHog = (projectToken: string, host: string): boolean => {
  const normalizedToken = projectToken.trim();
  const normalizedHost = host.trim().replace(/\/$/, '');
  if (!isValidPostHogConfiguration(normalizedToken, normalizedHost)) {
    requestedConfiguration = null;
    pendingActions = [];
    status = 'disabled';
    resetTrackingState();
    return false;
  }
  const key = `${normalizedHost}:${normalizedToken}`;
  if (requestedConfiguration?.key !== key) {
    pendingActions = [];
    resetTrackingState();
  }
  requestedConfiguration = { key, projectToken: normalizedToken, host: normalizedHost };
  if (client === null) {
    loadClient();
    return true;
  }
  try {
    initializeClient(client);
    flushActions(client);
    status = 'ready';
    return true;
  } catch {
    client = null;
    initializedConfiguration = null;
    status = 'failed';
    diagnoseFailure('sdk_load');
    return false;
  }
};
export const runPostHogAction = (action: PostHogAction): boolean => {
  if (requestedConfiguration === null || isAdminScreen()) return false;
  if (client !== null && initializedConfiguration === requestedConfiguration.key) return executeAction(action, client);
  if (pendingActions.length >= MAX_PENDING_ACTIONS) {
    droppedActions += 1;
    diagnoseFailure('queue_full');
    return false;
  }
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
  loadHeld = false;
  loadHoldRequested = false;
  status = 'disabled';
  failedActions = 0;
  droppedActions = 0;
  resetTrackingState();
  authenticationReader = null;
};

export const setPostHogSessionContext = (context: PostHogSessionContext): boolean => {
  if (context.app_version.trim().length === 0) return false;
  sessionContext = { ...context };
  return runPostHogAction((loadedClient) => loadedClient.register(context));
};
export const identifyPostHogMember = (memberId: number, nickname?: string): boolean => {
  if (!Number.isInteger(memberId) || memberId <= 0) return false;
  const distinctId = `member-${memberId}`;
  const identityKey = JSON.stringify([distinctId, nickname]);
  return runPostHogAction((loadedClient) => {
    if (identifiedMember === identityKey) return;
    loadedClient.identify(distinctId, nickname === undefined ? undefined : { name: nickname, nickname });
    identifiedMember = identityKey;
  });
};
export const resetPostHogIdentity = (): void => {
  runPostHogAction((loadedClient) => {
    if (identifiedMember === null && !loadedClient.get_property('$user_id')) return;
    loadedClient.reset();
    identifiedMember = null;
    if (sessionContext !== null) loadedClient.register(sessionContext);
  });
};
export const trackPostHogEvent = (eventName: string, properties?: Record<string, unknown>): boolean => {
  const eventProperties = getPostHogEventProperties(properties);
  return runPostHogAction((loadedClient) => loadedClient.capture(eventName, eventProperties));
};
/** 외부 이동 직전에는 SDK 배치 전송 대기 대신 Beacon으로 클릭 전송을 시도한다. */
export const trackPostHogOutboundEvent = (eventName: string, properties?: Record<string, unknown>): boolean => {
  const eventProperties = getPostHogEventProperties(properties);
  return runPostHogAction((loadedClient) =>
    loadedClient.capture(eventName, eventProperties, { send_instantly: true, transport: 'sendBeacon' }),
  );
};
export const trackPostHogPageView = (path: string): boolean => {
  if (lastTrackedPath === path) return false;
  const accepted = trackPostHogEvent('$pageview', { path });
  if (accepted) lastTrackedPath = path;
  return accepted;
};
