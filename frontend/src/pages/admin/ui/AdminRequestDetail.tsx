import { css } from '@emotion/css';
import { useState } from 'react';

import { type AdminLogEntry, formatAdminLogTime } from '@/features/admin/api/adminLogsApi';
import { Button } from '@/shared/ui/button/Button';

type AdminRequestDetailProps = { requestId: string; logs: AdminLogEntry[] };

const AdminRequestDetail = ({ requestId, logs }: AdminRequestDetailProps) => {
  const [copyMessage, setCopyMessage] = useState('');
  const completed = [...logs].reverse().find((log) => log.status !== null);
  return (
    <div className={styles.detail}>
      <p>
        요청 ID: <code>{requestId}</code>
      </p>
      <Button
        variant="neutral"
        onClick={() => {
          void Promise.resolve()
            .then(() => navigator.clipboard.writeText(requestId))
            .then(() => setCopyMessage('요청 ID를 복사했습니다.'))
            .catch(() => setCopyMessage('복사하지 못했습니다. 요청 ID를 선택해 복사해 주세요.'));
        }}
      >
        요청 ID 복사
      </Button>
      <p role="status">{copyMessage}</p>
      {logs.length === 0 ? (
        <p>해당 기간에 기록된 요청 로그가 없습니다. 환경과 기간을 확인해 주세요.</p>
      ) : (
        <>
          {completed ? (
            <dl className={styles.info}>
              <div>
                <dt>발생 시각 (KST)</dt>
                <dd>{formatAdminLogTime(completed.timestamp)}</dd>
              </div>
              <div>
                <dt>API</dt>
                <dd>
                  {completed.httpMethod ?? '기록 없음'} {completed.path ?? '기록 없음'}
                </dd>
              </div>
              <div>
                <dt>memberId</dt>
                <dd>{completed.memberId ?? '-'}</dd>
              </div>
              <div>
                <dt>HTTP 상태</dt>
                <dd>{completed.status}</dd>
              </div>
              <div>
                <dt>소요 시간</dt>
                <dd>{completed.durationMs === null ? '기록 없음' : `${completed.durationMs} ms`}</dd>
              </div>
            </dl>
          ) : (
            <p>이 조회 결과에는 HTTP 요청 완료 기록이 없습니다.</p>
          )}
          {!logs.some((log) => log.stackTrace) && <p>CloudWatch에 기록된 예외 스택 트레이스가 없습니다.</p>}
          <p>저장된 로그만 표시합니다. 기록되지 않은 원인이나 프론트엔드 오류는 이 화면에서 확인할 수 없습니다.</p>
          {logs.length === 100 && <p>최대 100건에 도달해 이후 로그가 생략되었을 수 있습니다.</p>}
          <ol className={styles.logs}>
            {logs.map((log, index) => (
              <li key={index}>
                <h4>{formatAdminLogTime(log.timestamp)} (KST)</h4>
                <p>{log.message ?? '메시지 기록 없음'}</p>
                {log.errorType && <p>오류 타입: {log.errorType}</p>}
                {log.exceptionType && <p>예외 타입: {log.exceptionType}</p>}
                {log.errorMessage && <p>예외 메시지: {log.errorMessage}</p>}
                {log.stackTrace && (
                  <pre tabIndex={0} aria-label="예외 스택 트레이스">
                    <code>{log.stackTrace}</code>
                  </pre>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
};
const styles = {
  detail: css`
    label: AdminRequestDetail-detail;
    overflow-wrap: anywhere;
    & p {
      margin: 0.75rem 0;
    }
    & pre {
      max-height: 28rem;
      overflow: auto;
      white-space: pre;
      padding: 1rem;
      background: #152233;
      color: #f2f5f8;
      border-radius: 8px;
      font: 0.8rem/1.6 monospace;
    }
  `,
  info: css`
    label: AdminRequestDetail-info;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin: 1rem 0;
    & dt {
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
  `,
  logs: css`
    label: AdminRequestDetail-logs;
    display: grid;
    gap: 1rem;
    padding: 0;
    list-style: none;
    & li {
      min-width: 0;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      padding: 1rem;
    }
    & h4 {
      font-weight: 700;
    }
  `,
};
export default AdminRequestDetail;
