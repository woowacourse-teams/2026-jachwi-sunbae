import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentMember } from '../../features/auth/api/useCurrentMember';
import { useAuthentication } from '../../features/auth/model/useAuthentication';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';
import {
  identifyPostHogMember,
  initPostHog,
  resetPostHogIdentity,
  trackPostHogPageView,
} from '../../shared/lib/analytics/posthog';
import { isRunningInNativeApp } from '../../shared/lib/native-app/nativeApp';

type PostHogTrackerProps = {
  config: PublicConfig;
};

const PostHogTracker = ({ config }: PostHogTrackerProps) => {
  const location = useLocation();
  const { session } = useAuthentication();
  const currentMember = useCurrentMember(config, session !== null);

  useEffect(() => {
    if (isRunningInNativeApp()) return;
    initPostHog(config.posthogProjectToken ?? '', config.posthogHost ?? '');
  }, [config.posthogProjectToken, config.posthogHost]);

  useEffect(() => {
    if (isRunningInNativeApp()) return;
    trackPostHogPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isRunningInNativeApp()) return;
    if (session === null) {
      resetPostHogIdentity();
      return;
    }

    if (currentMember.data !== undefined) {
      identifyPostHogMember(currentMember.data.memberId, currentMember.data.displayName);
    }
  }, [session, currentMember.data]);

  return null;
};

export default PostHogTracker;
