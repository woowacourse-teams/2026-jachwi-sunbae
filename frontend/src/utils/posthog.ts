import posthog from 'posthog-js';

let initializedConfiguration: string | null = null;
let trackingEnabled = false;
let lastTrackedPath: string | null = null;

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

export const initPostHog = (projectToken: string, host: string): boolean => {
  const normalizedProjectToken = projectToken.trim();
  const normalizedHost = host.trim().replace(/\/$/, '');

  if (!isValidPostHogConfiguration(normalizedProjectToken, normalizedHost)) return false;

  const configurationKey = `${normalizedHost}:${normalizedProjectToken}`;

  if (initializedConfiguration !== configurationKey) {
    posthog.init(normalizedProjectToken, {
      api_host: normalizedHost,
      autocapture: true,
      capture_pageview: false,
      disable_session_recording: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
    initializedConfiguration = configurationKey;
  }

  trackingEnabled = true;
  lastTrackedPath = null;
  return true;
};

export const trackPostHogPageView = (path: string): boolean => {
  if (!trackingEnabled || lastTrackedPath === path) return false;

  posthog.capture('$pageview', { path });
  lastTrackedPath = path;
  return true;
};

export const trackPostHogEvent = (eventName: string, properties?: Record<string, unknown>): boolean => {
  if (!trackingEnabled) return false;

  posthog.capture(eventName, properties);
  return true;
};

export const resetPostHogForTests = (): void => {
  initializedConfiguration = null;
  trackingEnabled = false;
  lastTrackedPath = null;
};

