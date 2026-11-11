import { useEffect, useState } from 'react';

import {
  type AdminLogEntry,
  type AdminLogFilters,
  type AdminLogSearch,
  describeAdminLogError,
  formatAdminLogTime,
} from '@/features/admin/api/adminLogsApi';
import { useAdminLogs } from '@/features/admin/api/useAdminLogs';
import { Button } from '@/shared/ui/button/Button';
import ProgressCircle from '@/shared/ui/progress-circle/ProgressCircle';

import AdminRequestDetail from './AdminRequestDetail';

import * as styles from './AdminLogViewer.styles';

type AdminLogsProps = { accessCode: string; onUnauthorized: () => void; initialSearch?: AdminLogSearch | null };

const AdminLogs = ({ accessCode, onUnauthorized, initialSearch }: AdminLogsProps) => {
  const [filters, setFilters] = useState<AdminLogFilters>({
    environment: initialSearch?.environment ?? 'dev',
    period: initialSearch?.period ?? '1h',
    status: 'all',
  });
  const [requestId, setRequestId] = useState(initialSearch?.requestId ?? '');
  const list = useAdminLogs(accessCode, onUnauthorized);
  const detail = useAdminLogs(accessCode, onUnauthorized);
  const searchDetail = detail.search;
  useEffect(() => {
    // StrictMode의 첫 effect가 정리된 뒤 실행해 조회 시작 요청이 중복되지 않게 한다.
    let cancelled = false;
    queueMicrotask(() => {
      if (initialSearch && !cancelled) void searchDetail(initialSearch);
    });
    return () => {
      cancelled = true;
    };
  }, [initialSearch, searchDetail]);
  const selectLog = (log: AdminLogEntry) => {
    if (list.state.status !== 'complete' || !log.requestId) return;
    setRequestId(log.requestId);
    void detail.search({ ...list.state.search, requestId: log.requestId });
  };
  return (
    <section className={styles.panel} aria-labelledby="admin-logs-title">
      <h2 id="admin-logs-title">오류 조회</h2>
      <p>CloudWatch에 기록된 API 오류를 최신순으로 최대 100건 조회합니다. 시각은 KST 기준입니다.</p>
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          if (list.state.status !== 'loading') void list.search(filters);
        }}
      >
        <label>
          환경
          <select
            value={filters.environment}
            onChange={(event) =>
              setFilters({ ...filters, environment: event.target.value as AdminLogFilters['environment'] })
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
            onChange={(event) => setFilters({ ...filters, period: event.target.value as AdminLogFilters['period'] })}
          >
            <option value="1h">최근 1시간</option>
            <option value="24h">최근 24시간</option>
            <option value="7d">최근 7일</option>
          </select>
        </label>
        <label>
          상태
          <select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value as AdminLogFilters['status'] })}
          >
            <option value="all">전체 (4xx·5xx)</option>
            <option value="4xx">4xx</option>
            <option value="5xx">5xx</option>
          </select>
        </label>
        <Button type="submit" isLoading={list.state.status === 'loading'}>
          오류 조회
        </Button>
      </form>
      {list.state.status === 'idle' && <p>조건을 선택하고 오류 조회를 눌러 주세요.</p>}
      {list.state.status === 'loading' && <ProgressCircle size={24} label="CloudWatch 오류 목록 조회 중" />}
      {list.state.status === 'error' && <p role="alert">{describeAdminLogError(list.state.error)}</p>}
      {list.state.status === 'complete' && (
        <>
          <p>
            조회 결과: {list.state.search.environment.toUpperCase()} · {list.state.search.status} ·{' '}
            {formatAdminLogTime(list.state.query.startTime)} ~ {formatAdminLogTime(list.state.query.endTime)} (KST)
          </p>
          {list.state.query.logs?.length === 0 ? (
            <p>조회된 API 오류가 없습니다.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table>
                <caption className="sr-only">API 오류 목록</caption>
                <thead>
                  <tr>
                    {[
                      '발생 시각 (KST)',
                      '메서드',
                      'API 경로',
                      '상태 코드',
                      '소요 시간',
                      'memberId',
                      '예외 타입',
                      '오류 메시지',
                      '요청 ID',
                    ].map((title) => (
                      <th key={title} scope="col">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.state.query.logs?.map((log, index) => (
                    <tr key={index} onClick={() => selectLog(log)}>
                      <td>{formatAdminLogTime(log.timestamp)}</td>
                      <td>{log.httpMethod ?? '기록 없음'}</td>
                      <td>
                        <span className={styles.truncated} title={log.path ?? undefined}>
                          {log.path ?? '기록 없음'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          data-level={log.status !== null && log.status >= 500 ? '5xx' : '4xx'}
                        >
                          {log.status ?? '기록 없음'}
                        </span>
                      </td>
                      <td>{log.durationMs === null ? '기록 없음' : `${log.durationMs} ms`}</td>
                      <td>{log.memberId ?? '-'}</td>
                      <td>
                        <span className={styles.truncated} title={log.errorType ?? undefined}>
                          {log.errorType ?? '-'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.truncated} title={log.message ?? undefined}>
                          {log.message ?? '기록 없음'}
                        </span>
                      </td>
                      <td>
                        {log.requestId ? (
                          <button type="button" className={styles.link}>
                            {log.requestId}
                          </button>
                        ) : (
                          '기록 없음'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <section aria-labelledby="admin-request-title">
        <h3 id="admin-request-title">요청 상세</h3>
        <p>위 환경·기간으로 요청 ID를 검색합니다. HTTP 200 등 정상 응답도 포함하며 상태 필터는 적용하지 않습니다.</p>
        <form
          className={styles.filters}
          onSubmit={(event) => {
            event.preventDefault();
            if (detail.state.status !== 'loading') void detail.search({ ...filters, requestId: requestId.trim() });
          }}
        >
          <label>
            요청 ID
            <input
              value={requestId}
              onChange={(event) => setRequestId(event.target.value)}
              required
              maxLength={128}
              pattern="[a-zA-Z0-9_\-]+"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <Button type="submit" isLoading={detail.state.status === 'loading'}>
            요청 ID 조회
          </Button>
        </form>
        {detail.state.status === 'loading' && <ProgressCircle size={24} label="CloudWatch 요청 상세 조회 중" />}
        {detail.state.status === 'error' && <p role="alert">{describeAdminLogError(detail.state.error)}</p>}
        {detail.state.status === 'complete' && (
          <>
            <p>
              상세 조회 환경: {detail.state.search.environment.toUpperCase()} ·{' '}
              {formatAdminLogTime(detail.state.query.startTime)} ~ {formatAdminLogTime(detail.state.query.endTime)}{' '}
              (KST)
            </p>
            <AdminRequestDetail
              key={detail.state.query.queryId}
              requestId={detail.state.search.requestId ?? ''}
              logs={detail.state.query.logs ?? []}
            />
          </>
        )}
      </section>
    </section>
  );
};
export default AdminLogs;
