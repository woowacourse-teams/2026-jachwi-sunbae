import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initPostHog, trackPostHogPageView } from '../utils/posthog';

type PostHogTrackerProps = {
  projectToken?: string;
  host?: string;
};

const PostHogTracker = ({ projectToken = '', host = '' }: PostHogTrackerProps) => {
  const location = useLocation();

  useEffect(() => {
    initPostHog(projectToken, host);
  }, [projectToken, host]);

  useEffect(() => {
    trackPostHogPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
};

export default PostHogTracker;
