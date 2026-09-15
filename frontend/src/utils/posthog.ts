type PostHogClient = (typeof import('posthog-js'))['default'];
type PostHogAction = (client: PostHogClient) => void;

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

export const identifyPostHogMember = (memberId: number, displayName?: string): boolean => {
  if (!trackingEnabled || !Number.isInteger(memberId) || memberId <= 0) return false;

  const distinctId = `member-${memberId}`;
  return runPostHogAction((client) =>
    client.identify(distinctId, {
      displayName: displayName ?? distinctId,
      name: displayName ?? distinctId,
    }),
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
