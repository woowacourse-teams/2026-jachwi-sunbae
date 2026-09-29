const META_PIXEL_SCRIPT_ID = 'meta-pixel-script';
const META_PIXEL_SCRIPT_URL = 'https://connect.facebook.net/en_US/fbevents.js';

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
};

type MetaPixelWindow = Window & {
  fbq?: MetaPixelFunction;
  _fbq?: MetaPixelFunction;
};

let initializedPixelId: string | null = null;
let trackingEnabled = false;
let lastPageViewLocation: string | null = null;

const getMetaPixelWindow = (): MetaPixelWindow | null =>
  typeof window === 'undefined' ? null : (window as MetaPixelWindow);

const createMetaPixelFunction = (): MetaPixelFunction => {
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod !== undefined) {
      fbq.callMethod(...args);
      return;
    }
    fbq.queue.push(args);
  }) as MetaPixelFunction;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  return fbq;
};

export const isValidMetaPixelId = (pixelId: string): boolean => /^\d{5,20}$/.test(pixelId);

const initializeMetaPixel = (pixelId: string): MetaPixelFunction | null => {
  if (!isValidMetaPixelId(pixelId)) return null;

  const target = getMetaPixelWindow();
  if (target === null) return null;

  const fbq = target.fbq ?? createMetaPixelFunction();
  target.fbq = fbq;
  target._fbq ??= fbq;

  if (document.getElementById(META_PIXEL_SCRIPT_ID) === null) {
    const script = document.createElement('script');
    script.id = META_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = META_PIXEL_SCRIPT_URL;
    document.head.append(script);
  }

  if (initializedPixelId !== pixelId) {
    fbq('init', pixelId);
    initializedPixelId = pixelId;
  }

  return fbq;
};

export const grantMetaPixelConsent = (pixelId: string): boolean => {
  const fbq = initializeMetaPixel(pixelId);
  if (fbq === null) return false;

  if (!trackingEnabled) {
    trackingEnabled = true;
    lastPageViewLocation = null;
    fbq('consent', 'grant');
  }
  return true;
};

export const revokeMetaPixelConsent = (): void => {
  const target = getMetaPixelWindow();
  if (trackingEnabled && target?.fbq !== undefined) target.fbq('consent', 'revoke');
  trackingEnabled = false;
  lastPageViewLocation = null;
};

const track = (...args: unknown[]): boolean => {
  const fbq = getMetaPixelWindow()?.fbq;
  if (!trackingEnabled || fbq === undefined) return false;
  fbq(...args);
  return true;
};

export const trackMetaPixelPageView = (location: string): boolean => {
  if (lastPageViewLocation === location) return false;
  if (!track('track', 'PageView')) return false;
  lastPageViewLocation = location;
  return true;
};

export const trackMetaPixelCompleteRegistration = (): boolean => track('track', 'CompleteRegistration');

export const trackMetaPixelFirstPropertyRecorded = (): boolean => track('trackCustom', 'FirstPropertyRecorded');

export const resetMetaPixelForTests = (): void => {
  const target = getMetaPixelWindow();
  if (target !== null) {
    delete target.fbq;
    delete target._fbq;
  }
  document.getElementById(META_PIXEL_SCRIPT_ID)?.remove();
  initializedPixelId = null;
  trackingEnabled = false;
  lastPageViewLocation = null;
};
