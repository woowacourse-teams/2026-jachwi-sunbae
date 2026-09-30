type PostHogClient = (typeof import('posthog-js'))['default'];
type PostHogAction = (client: PostHogClient) => void;
export type PostHogErrorSeverity = 'P0' | 'P1' | 'P2';
export type PostHogErrorCategory = 'uncaught' | 'render' | 'api_server' | 'api_contract' | 'network';
type PostHogSessionContext = {
  environment: 'production' | 'development';
  app_version: string;
  platform: 'web' | 'ios_webview' | 'android_webview';
};

let initializedConfiguration: string | null = null;
let requestedConfiguration: { key: string; projectToken: string; host: string } | null = null;
let trackingEnabled = false;
let lastTrackedPath: string | null = null;
let postHogClient: PostHogClient | null = null;
let postHogClientPromise: Promise<void> | null = null;
let pendingActions: PostHogAction[] = [];

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidPostHogConfiguration = (projectToken: string, host: string): boolean =>
  projectToken.trim().length > 0 && isHttpUrl(host);

const flushPendingActions = (client: PostHogClient): void => {
  const actions = pendingActions;
  pendingActions = [];
  actions.forEach((action) => action(client));
};

const initializePostHogClient = (
  client: PostHogClient,
  configuration: NonNullable<typeof requestedConfiguration>,
): void => {
  if (initializedConfiguration === configuration.key) return;

  client.init(configuration.projectToken, {
    api_host: configuration.host,
    autocapture: true,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
    },
    before_send: (event) => {
      if (event === null || event.event !== '$exception') return event;

      return {
        ...event,
        properties: {
          ...event.properties,
          error_category: event.properties.error_category ?? 'uncaught',
          severity: event.properties.severity ?? 'P0',
        },
      };
    },
    capture_pageview: false,
    disable_session_recording: false,
    mask_all_text: true,
    mask_all_element_attributes: true,
  });
  initializedConfiguration = configuration.key;
};

const loadPostHog = (): void => {
  postHogClientPromise ??= import('posthog-js')
    .then(({ default: client }) => {
      postHogClient = client;

      const configuration = requestedConfiguration;
      if (configuration !== null) initializePostHogClient(client, configuration);

      flushPendingActions(client);
    })
    .catch(() => {
      postHogClientPromise = null;
      trackingEnabled = false;
      pendingActions = [];
    });
};

const runPostHogAction = (action: PostHogAction): boolean => {
  if (!trackingEnabled) return false;
  if (postHogClient !== null && initializedConfiguration === requestedConfiguration?.key) {
    action(postHogClient);
    return true;
  }

  pendingActions.push(action);
  loadPostHog();
  return true;
};

export const initPostHog = (projectToken: string, host: string): boolean => {
  const normalizedProjectToken = projectToken.trim();
  const normalizedHost = host.trim().replace(/\/$/, '');

  if (!isValidPostHogConfiguration(normalizedProjectToken, normalizedHost)) return false;

  const configurationKey = `${normalizedHost}:${normalizedProjectToken}`;
  requestedConfiguration = { key: configurationKey, projectToken: normalizedProjectToken, host: normalizedHost };
  trackingEnabled = true;
  lastTrackedPath = null;
  if (postHogClient === null) {
    loadPostHog();
  } else {
    initializePostHogClient(postHogClient, requestedConfiguration);
    flushPendingActions(postHogClient);
  }
  return true;
};

export const trackPostHogPageView = (path: string): boolean => {
  if (!trackingEnabled || lastTrackedPath === path) return false;

  runPostHogAction((client) => client.capture('$pageview', { path }));
  lastTrackedPath = path;
  return true;
};

export const trackPostHogEvent = (eventName: string, properties?: Record<string, unknown>): boolean => {
  if (!trackingEnabled) return false;

  return runPostHogAction((client) => client.capture(eventName, properties));
};

export const setPostHogSessionContext = (context: PostHogSessionContext): boolean => {
  if (!trackingEnabled || context.app_version.trim().length === 0) return false;

  return runPostHogAction((client) => client.register(context));
};

export const getPostHogPlatform = (): PostHogSessionContext['platform'] => {
  if (typeof navigator === 'undefined') return 'web';

  const userAgent = navigator.userAgent;
  if (/\bwv\b|; wv\)/i.test(userAgent)) return 'android_webview';

  const isIos = /iPad|iPhone|iPod/i.test(userAgent);
  const isIosBrowser = /CriOS|FxiOS|EdgiOS|Safari/i.test(userAgent);
  if (isIos && !isIosBrowser) return 'ios_webview';

  return 'web';
};

export const capturePostHogException = (error: unknown, properties?: Record<string, unknown>): boolean => {
  if (!trackingEnabled) return false;

  return runPostHogAction((client) => client.captureException(error, properties));
};

export const identifyPostHogMember = (memberId: number, nickname?: string): boolean => {
  if (!trackingEnabled || !Number.isInteger(memberId) || memberId <= 0) return false;

  const distinctId = `member-${memberId}`;
  return runPostHogAction((client) =>
    client.identify(distinctId, nickname === undefined ? undefined : { name: nickname, nickname }),
  );
};

export const resetPostHogIdentity = (): void => {
  if (initializedConfiguration !== null) runPostHogAction((client) => client.reset());
};

export const resetPostHogForTests = (): void => {
  initializedConfiguration = null;
  requestedConfiguration = null;
  trackingEnabled = false;
  lastTrackedPath = null;
  postHogClient = null;
  postHogClientPromise = null;
  pendingActions = [];
};
