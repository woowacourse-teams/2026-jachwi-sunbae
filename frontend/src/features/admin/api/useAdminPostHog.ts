import { useEffect, useRef, useState } from 'react';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import { AdminApiError, isAdminUnauthorized } from './adminApi';
import { type AdminPostHogResult, type AdminPostHogSearch, fetchAdminPostHogErrors } from './adminPostHogApi';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'complete'; search: AdminPostHogSearch; result: AdminPostHogResult };

export const useAdminPostHog = (accessCode: string, onUnauthorized: () => void) => {
  const config = usePublicConfig();
  const active = useRef<AbortController | null>(null);
  const [state, setState] = useState<State>({ status: 'idle' });
  useEffect(() => () => active.current?.abort(), []);
  const search = async (conditions: AdminPostHogSearch) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(new DOMException('조회 시간 초과', 'TimeoutError')), 20000);
    setState({ status: 'loading' });
    try {
      const result = await fetchAdminPostHogErrors(config, accessCode, conditions, controller.signal);
      if (!Array.isArray(result.events)) throw new AdminApiError(null, 'ADMIN_POSTHOG_UNAVAILABLE');
      if (!controller.signal.aborted) setState({ status: 'complete', search: conditions, result });
    } catch (error) {
      if (
        active.current !== controller ||
        (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError')
      )
        return;
      if (isAdminUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setState({
        status: 'error',
        error: controller.signal.aborted ? new AdminApiError(null, 'ADMIN_POSTHOG_TIMEOUT') : error,
      });
    } finally {
      clearTimeout(timeout);
    }
  };
  return { state, search };
};
