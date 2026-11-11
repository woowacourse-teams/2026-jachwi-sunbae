import { css } from '@emotion/css';
import { useState } from 'react';

import { type AdminLogFilters, describeAdminLogError, formatAdminLogTime } from '@/features/admin/api/adminLogsApi';
import { useAdminLogs } from '@/features/admin/api/useAdminLogs';
import { Button } from '@/shared/ui/button/Button';
import ProgressCircle from '@/shared/ui/progress-circle/ProgressCircle';

import AdminRequestDetail from './AdminRequestDetail';

type AdminLogsProps = { accessCode: string; onUnauthorized: () => void };

const AdminLogs = ({ accessCode, onUnauthorized }: AdminLogsProps) => {
  const [filters, setFilters] = useState<AdminLogFilters>({ environment: 'dev', period: '1h', status: 'all' });
  const [requestId, setRequestId] = useState('');
  const list = useAdminLogs(accessCode, onUnauthorized);
  const detail = useAdminLogs(accessCode, onUnauthorized);
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
                    {['발생 시각 (KST)', '메서드', 'API 경로', '상태 코드', '소요 시간', '오류 메시지', '요청 ID'].map(
                      (title) => (
                        <th key={title} scope="col">
                          {title}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {list.state.query.logs?.map((log, index) => (
                    <tr key={index}>
                      <td>{formatAdminLogTime(log.timestamp)}</td>
                      <td>{log.httpMethod ?? '기록 없음'}</td>
                      <td>{log.path ?? '기록 없음'}</td>
                      <td>{log.status ?? '기록 없음'}</td>
                      <td>{log.durationMs === null ? '기록 없음' : `${log.durationMs} ms`}</td>
                      <td>
                        {log.message ?? '기록 없음'}
                        {log.errorType && <small>{log.errorType}</small>}
                      </td>
                      <td>
                        {log.requestId ? (
                          <button
                            type="button"
                            className={styles.requestLink}
                            onClick={() => {
                              if (list.state.status !== 'complete' || !log.requestId) return;
                              setRequestId(log.requestId);
                              void detail.search({ ...list.state.search, requestId: log.requestId });
                            }}
                          >
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
const styles = {
  panel: css`
    label: AdminLogs-panel;
    & h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    & p {
      margin: 0.75rem 0;
    }
  `,
  filters: css`
    label: AdminLogs-filters;
    display: flex;
    align-items: end;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1rem 0;
    & label {
      display: grid;
      gap: 0.5rem;
    }
    & input,
    & select {
      padding: 0.75rem;
      border: 1px solid #738091;
      border-radius: 8px;
      background: #fff;
    }
    & input {
      width: min(26rem, 70vw);
    }
  `,
  tableScroll: css`
    label: AdminLogs-tableScroll;
    max-width: 100%;
    overflow-x: auto;
    & table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    & th,
    & td {
      padding: 0.75rem;
      border-bottom: 1px solid #dfe3e8;
      min-width: 7rem;
      vertical-align: top;
    }
    & td {
      max-width: 24rem;
      overflow-wrap: anywhere;
    }
    & thead {
      background: #f2f5f8;
      white-space: nowrap;
    }
    & small {
      display: block;
      margin-top: 0.5rem;
    }
  `,
  requestLink: css`
    label: AdminLogs-requestLink;
    color: #164b86;
    text-decoration: underline;
    text-align: left;
    overflow-wrap: anywhere;
  `,
};
export default AdminLogs;
