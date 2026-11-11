import { useCallback, useEffect, useRef, useState } from 'react';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import { AdminApiError, isAdminUnauthorized } from './adminApi';
import { type AdminLogQuery, type AdminLogSearch, createAdminLogQuery, fetchAdminLogQuery } from './adminLogsApi';

const waitForPoll = (signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, 1000);
    signal.addEventListener('abort', abort, { once: true });
  });

type LogState =
  | { status: 'idle' }
  | { status: 'loading'; search: AdminLogSearch }
  | { status: 'error'; search: AdminLogSearch; error: unknown }
  | { status: 'complete'; search: AdminLogSearch; query: AdminLogQuery };

export const useAdminLogs = (accessCode: string, onUnauthorized: () => void) => {
  const config = usePublicConfig();
  const active = useRef<AbortController | null>(null);
  const [state, setState] = useState<LogState>({ status: 'idle' });
  useEffect(() => () => active.current?.abort(), []);

  const search = useCallback(
    async (conditions: AdminLogSearch) => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      const timeout = setTimeout(() => controller.abort(new DOMException('조회 시간 초과', 'TimeoutError')), 75000);
      setState({ status: 'loading', search: conditions });
      try {
        let query = await createAdminLogQuery(config, accessCode, conditions, controller.signal);
        while (query.status === 'Scheduled' || query.status === 'Running') {
          await waitForPoll(controller.signal);
          query = await fetchAdminLogQuery(config, accessCode, query.queryId, controller.signal);
        }
        if (query.status !== 'Complete' || !Array.isArray(query.logs))
          throw new AdminApiError(null, 'ADMIN_LOG_UNAVAILABLE');
        if (!controller.signal.aborted) setState({ status: 'complete', search: conditions, query });
      } catch (error) {
        if (active.current !== controller) return;
        if (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError') return;
        if (isAdminUnauthorized(error)) {
          onUnauthorized();
          return;
        }
        setState({
          status: 'error',
          search: conditions,
          error: controller.signal.aborted ? new AdminApiError(null, 'ADMIN_LOG_QUERY_TIMEOUT') : error,
        });
      } finally {
        clearTimeout(timeout);
      }
    },
    [config, accessCode, onUnauthorized],
  );

  return { state, search };
};
