import { css } from '@emotion/css';
import { useState } from 'react';

import { formatAdminLogTime } from '@/features/admin/api/adminLogsApi';
import type { AdminPostHogEvent } from '@/features/admin/api/adminPostHogApi';
import { Button } from '@/shared/ui/button/Button';

type AdminPostHogDetailProps = { event: AdminPostHogEvent; onOpenServerLogs: () => void };
const AdminPostHogDetail = ({ event, onOpenServerLogs }: AdminPostHogDetailProps) => {
  const [copyMessage, setCopyMessage] = useState('');
  return (
    <section className={styles.detail} aria-labelledby="posthog-detail-title">
      <h3 id="posthog-detail-title">PostHog 오류 상세</h3>
      <dl className={styles.info}>
        <div>
          <dt>발생 시각 (KST)</dt>
          <dd>{formatAdminLogTime(event.timestamp)}</dd>
        </div>
        <div>
          <dt>환경 · 플랫폼</dt>
          <dd>
            {event.environment ?? '-'} · {event.platform ?? '-'}
          </dd>
        </div>
        <div>
          <dt>memberId</dt>
          <dd>{event.memberId ?? '-'}</dd>
        </div>
        <div>
          <dt>사용자 식별자</dt>
          <dd>{event.distinctId ?? '-'}</dd>
        </div>
        <div>
          <dt>화면</dt>
          <dd>{event.screenRoute ?? '-'}</dd>
        </div>
        <div>
          <dt>오류 등급 · 종류</dt>
          <dd>
            {event.severity ?? '-'} · {event.errorCategory ?? '-'}
          </dd>
        </div>
        <div>
          <dt>API 요청</dt>
          <dd>
            {event.requestMethod ?? '-'} {event.requestPath ?? '-'}
          </dd>
        </div>
        <div>
          <dt>HTTP 상태 · 오류 코드</dt>
          <dd>
            {event.responseStatus ?? '-'} · {event.errorCode ?? '-'}
          </dd>
        </div>
        <div>
          <dt>Request ID</dt>
          <dd>{event.requestId ?? '-'}</dd>
        </div>
      </dl>
      {event.memberId === null && <p>회원 ID가 기록된 식별자가 아닙니다. 익명 이벤트의 회원을 추정하지 않습니다.</p>}
      <div className={styles.actions}>
        {event.requestId ? (
          <>
            <Button variant="neutral" onClick={onOpenServerLogs}>
              서버 로그 확인
            </Button>
            <Button
              variant="neutral"
              onClick={() => {
                void Promise.resolve()
                  .then(() => navigator.clipboard.writeText(event.requestId ?? ''))
                  .then(() => setCopyMessage('요청 ID를 복사했습니다.'))
                  .catch(() => setCopyMessage('요청 ID를 선택해 직접 복사해 주세요.'));
              }}
            >
              요청 ID 복사
            </Button>
          </>
        ) : (
          <p>요청 ID가 없어 연결할 서버 로그가 없습니다.</p>
        )}
        <a href="https://us.posthog.com/project/579863" target="_blank" rel="noopener noreferrer">
          PostHog에서 확인 ↗
        </a>
      </div>
      <p role="status">{copyMessage}</p>
      {event.exceptions?.map((exception, index) => (
        <article key={index}>
          <h4>{exception.type ?? '예외 타입 기록 없음'}</h4>
          <p className={styles.message}>{exception.message ?? '예외 메시지 기록 없음'}</p>
          {exception.frames && exception.frames.length > 0 && (
            <pre tabIndex={0} aria-label="PostHog 예외 스택">
              <code>
                {exception.frames
                  .map(
                    (frame) =>
                      `${frame.function ?? '[함수 기록 없음]'} (${frame.filename ?? '[파일 기록 없음]'}${frame.line === null ? '' : `:${frame.line}`}${frame.column === null ? '' : `:${frame.column}`})`,
                  )
                  .join('\n')}
              </code>
            </pre>
          )}
        </article>
      ))}
      {!event.exceptions?.length && <p>PostHog에 기록된 예외 유형과 메시지가 없습니다.</p>}
      {!event.exceptions?.some((exception) => exception.frames?.length) && (
        <p>PostHog에 기록된 예외 스택 정보가 없습니다.</p>
      )}
      <p>저장된 예외 정보만 표시합니다. 코드 변수·본문·전체 이벤트 원문은 표시하지 않습니다.</p>
    </section>
  );
};
const styles = {
  detail: css`
    label: AdminPostHogDetail-detail;
    border-top: 1px solid var(--log-border);
    padding-top: 1rem;
    overflow-wrap: anywhere;
    & h4 {
      font-weight: 700;
      margin-top: 1rem;
    }
    & pre {
      max-height: 26rem;
      overflow: auto;
      padding: 1rem;
      background: #080c12;
      border: 1px solid var(--log-border);
      white-space: pre;
      font: 0.8rem/1.6 monospace;
    }
  `,
  info: css`
    label: AdminPostHogDetail-info;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
    gap: 1rem;
    & dt {
      color: var(--log-muted);
      margin-bottom: 0.35rem;
    }
    & dd {
      margin: 0;
    }
  `,
  actions: css`
    label: AdminPostHogDetail-actions;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
  `,
  message: css`
    label: AdminPostHogDetail-message;
    white-space: pre-wrap;
  `,
};
export default AdminPostHogDetail;
