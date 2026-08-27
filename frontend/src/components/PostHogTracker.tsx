import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentMember } from '../hooks/query/useCurrentMember';
import { useAuthentication } from '../hooks/useAuthentication';
import type { PublicConfig } from '../types/PublicConfig';
import { identifyPostHogMember, initPostHog, resetPostHogIdentity, trackPostHogPageView } from '../utils/posthog';

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
