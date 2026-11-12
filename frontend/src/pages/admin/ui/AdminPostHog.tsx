import { useState } from 'react';

import { type AdminLogSearch, formatAdminLogTime } from '@/features/admin/api/adminLogsApi';
import {
  type AdminPostHogEvent,
  type AdminPostHogSearch,
  describeAdminPostHogError,
} from '@/features/admin/api/adminPostHogApi';
import { useAdminPostHog } from '@/features/admin/api/useAdminPostHog';
import { Button } from '@/shared/ui/button/Button';
import ProgressCircle from '@/shared/ui/progress-circle/ProgressCircle';

import AdminPostHogDetail from './AdminPostHogDetail';

import * as styles from './AdminLogViewer.styles';

type AdminPostHogProps = {
  accessCode: string;
  onUnauthorized: () => void;
  onOpenServerLogs: (search: AdminLogSearch) => void;
};
const AdminPostHog = ({ accessCode, onUnauthorized, onOpenServerLogs }: AdminPostHogProps) => {
  const [filters, setFilters] = useState<AdminPostHogSearch>({ environment: 'dev', period: '1h', severity: 'all' });
  const [requestId, setRequestId] = useState('');
  const [selected, setSelected] = useState<AdminPostHogEvent | null>(null);
  const { state, search } = useAdminPostHog(accessCode, onUnauthorized);
  return (
    <section className={styles.panel} aria-labelledby="posthog-errors-title">
      <h2 id="posthog-errors-title">PostHog 프론트엔드 오류</h2>
      <p>수집된 예외 이벤트를 최신순 최대 100건 표시합니다. 시각은 KST 기준입니다.</p>
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          if (state.status === 'loading') return;
          setSelected(null);
          void search({ ...filters, ...(requestId.trim() ? { requestId: requestId.trim() } : {}) });
        }}
      >
        <label>
          환경
          <select
            value={filters.environment}
            onChange={(event) =>
              setFilters({ ...filters, environment: event.target.value as AdminPostHogSearch['environment'] })
            }
          >
            <option value="dev">Dev</option>
            <option value="prod">Prod</option>
          </select>
        </label>
        <label>
          기간
          <select
            value={filters.period}
            onChange={(event) => setFilters({ ...filters, period: event.target.value as AdminPostHogSearch['period'] })}
          >
            <option value="1h">최근 1시간</option>
            <option value="24h">최근 24시간</option>
            <option value="7d">최근 7일</option>
          </select>
        </label>
        <label>
          오류 등급
          <select
            value={filters.severity}
            onChange={(event) =>
              setFilters({ ...filters, severity: event.target.value as AdminPostHogSearch['severity'] })
            }
          >
            <option value="all">전체</option>
            <option value="P0">P0</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
          </select>
        </label>
        <label>
          요청 ID (선택)
          <input
            value={requestId}
            onChange={(event) => setRequestId(event.target.value)}
            maxLength={128}
            pattern="[a-zA-Z0-9_\-]+"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <Button type="submit" isLoading={state.status === 'loading'}>
          PostHog 오류 조회
        </Button>
      </form>
      {state.status === 'idle' && <p>조건을 선택하고 PostHog 오류 조회를 눌러 주세요.</p>}
      {state.status === 'loading' && <ProgressCircle size={24} label="PostHog 오류 조회 중" />}
      {state.status === 'error' && <p role="alert">{describeAdminPostHogError(state.error)}</p>}
      {state.status === 'complete' && (
        <>
          <p>
            조회 결과: {state.search.environment.toUpperCase()} · {state.search.severity} ·{' '}
            {formatAdminLogTime(state.result.startTime)} ~ {formatAdminLogTime(state.result.endTime)} (KST)
          </p>
          {state.result.events.length === 0 ? (
            <p>조회된 PostHog 오류가 없습니다.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table>
                <caption className="sr-only">PostHog 프론트엔드 오류 목록</caption>
                <thead>
                  <tr>
                    {[
                      '시간 (KST)',
                      '환경 · 플랫폼',
                      '화면',
                      '오류 등급',
                      'memberId',
                      '오류 종류',
                      '오류 메시지',
                      'Request ID',
                    ].map((title) => (
                      <th key={title} scope="col">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.result.events.map((event, index) => (
                    <tr
                      key={event.eventId ?? index}
                      aria-selected={selected === event}
                      onClick={() => setSelected(event)}
                    >
                      <td>{formatAdminLogTime(event.timestamp)}</td>
                      <td>
                        {event.environment ?? '-'} · {event.platform ?? '-'}
                      </td>
                      <td>
                        <span className={styles.truncated} title={event.screenRoute ?? undefined}>
                          {event.screenRoute ?? '-'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.badge} data-level={event.severity}>
                          {event.severity ?? '-'}
                        </span>
                      </td>
                      <td>{event.memberId ?? '-'}</td>
                      <td>{event.errorCategory ?? '-'}</td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.truncated} ${styles.link}`}
                          title={event.exceptions?.[0]?.message ?? undefined}
                        >
                          {event.exceptions?.[0]?.message ?? '오류 상세 보기'}
                        </button>
                      </td>
                      <td>{event.requestId ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selected && (
            <AdminPostHogDetail
              key={selected.eventId ?? state.result.events.indexOf(selected)}
              event={selected}
              onOpenServerLogs={() => {
                if (selected.requestId)
                  onOpenServerLogs({
                    environment: state.search.environment,
                    period: state.search.period,
                    status: 'all',
                    requestId: selected.requestId,
                  });
              }}
            />
          )}
        </>
      )}
    </section>
  );
};
export default AdminPostHog;
