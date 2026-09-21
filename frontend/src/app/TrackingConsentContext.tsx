import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TrackingConsentBanner from '../components/TrackingConsentBanner';
import {
  grantMetaPixelConsent,
  isValidMetaPixelId,
  revokeMetaPixelConsent,
  trackMetaPixelPageView,
} from '../utils/metaPixel';

const TRACKING_CONSENT_STORAGE_KEY = 'jachwi-sunbae:meta-tracking-consent';

export type TrackingConsentStatus = 'undecided' | 'granted' | 'denied';

type TrackingConsentContextValue = {
  available: boolean;
  status: TrackingConsentStatus;
  grant: () => void;
  deny: () => void;
};

const TrackingConsentContext = createContext<TrackingConsentContextValue>({
  available: false,
  status: 'denied',
  grant: () => undefined,
  deny: () => undefined,
});

const readStoredConsent = (): TrackingConsentStatus => {
  if (typeof window === 'undefined') return 'undecided';
  const stored = window.localStorage.getItem(TRACKING_CONSENT_STORAGE_KEY);
  return stored === 'granted' || stored === 'denied' ? stored : 'undecided';
};

const storeConsent = (status: Exclude<TrackingConsentStatus, 'undecided'>): void => {
  if (typeof window !== 'undefined') window.localStorage.setItem(TRACKING_CONSENT_STORAGE_KEY, status);
};

type TrackingConsentProviderProps = {
  children: ReactNode;
  metaPixelId?: string;
};

export const TrackingConsentProvider = ({ children, metaPixelId = '' }: TrackingConsentProviderProps) => {
  const [status, setStatus] = useState<TrackingConsentStatus>(readStoredConsent);
  const location = useLocation();
  const available = isValidMetaPixelId(metaPixelId);

  useEffect(() => {
    if (!available || status !== 'granted') {
      revokeMetaPixelConsent();
      return;
    }
    grantMetaPixelConsent(metaPixelId);
  }, [available, metaPixelId, status]);

  useEffect(() => {
    if (available && status === 'granted') {
      trackMetaPixelPageView(`${location.pathname}${location.search}`);
    }
  }, [available, location.pathname, location.search, status]);

  const value = useMemo<TrackingConsentContextValue>(
    () => ({
      available,
      status,
      grant: () => {
        storeConsent('granted');
        setStatus('granted');
      },
      deny: () => {
        storeConsent('denied');
        revokeMetaPixelConsent();
        setStatus('denied');
      },
    }),
    [available, status],
  );

  return (
    <TrackingConsentContext.Provider value={value}>
      {children}
      {available && status === 'undecided' ? <TrackingConsentBanner /> : null}
    </TrackingConsentContext.Provider>
  );
};

export const useTrackingConsent = (): TrackingConsentContextValue => useContext(TrackingConsentContext);
