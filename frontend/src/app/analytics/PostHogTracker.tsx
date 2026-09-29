import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentMember } from '../../features/auth/api/useCurrentMember';
import { useAuthentication } from '../../features/auth/model/useAuthentication';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';
import {
  identifyPostHogMember,
  initPostHog,
  getPostHogPlatform,
  resetPostHogIdentity,
  setPostHogSessionContext,
  trackPostHogPageView,
} from '../../shared/lib/analytics/posthog';

type PostHogTrackerProps = {
  config: PublicConfig;
};

const PostHogTracker = ({ config }: PostHogTrackerProps) => {
  const location = useLocation();
  const { session } = useAuthentication();
  const currentMember = useCurrentMember(config, session !== null);

  useEffect(() => {
    initPostHog(config.posthogProjectToken ?? '', config.posthogHost ?? '');
  }, [config.posthogProjectToken, config.posthogHost]);

  useEffect(() => {
    setPostHogSessionContext({
      environment: config.appEnvironment ?? 'production',
      app_version: config.appVersion ?? 'unknown',
      platform: getPostHogPlatform(),
    });
  }, [config.appEnvironment, config.appVersion]);

  useEffect(() => {
    trackPostHogPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  useEffect(() => {
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
