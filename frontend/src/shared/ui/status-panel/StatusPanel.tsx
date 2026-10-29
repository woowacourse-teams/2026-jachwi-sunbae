import { css, cx, keyframes } from '@emotion/css';
import type { ReactNode } from 'react';

import StateIllustration, { type StateIllustrationName } from '@/shared/ui/state-illustration/StateIllustration';

const spinKeyframes = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const styles = {
  page: css`
    label: StatusPanel-page;
    display: grid;
    min-height: 100svh;
    padding: 1.25rem;
    place-items: center;
  `,

  panel: css`
    label: StatusPanel-panel;
    width: min(100%, 430px);
    padding: clamp(1.5rem, 7vw, 2.25rem);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-translucent);
    text-align: center;

    & h1 {
      margin: 0;
      font-size: 1.45rem;
      letter-spacing: -0.04em;
    }

    & p {
      margin: 0.75rem 0 0;
      color: var(--color-ink-soft);
      line-height: 1.6;
    }
  `,

  // 다른 요소의 선택자에서 `.StatusPanel-mark`로 가리킨다.
  mark: cx(
    css`
      label: StatusPanel-mark;
      display: grid;
      width: 3.25rem;
      height: 3.25rem;
      margin: 0 auto 1rem;
      border-radius: 50%;
      place-items: center;
      background: var(--color-surface-muted);
      color: var(--color-primary-dark);
      font-size: 1.4rem;
      font-weight: 800;
    `,
    'StatusPanel-mark',
  ),

  success: css`
    label: StatusPanel-success;

    & .StatusPanel-mark {
      background: var(--color-success-surface);
      color: var(--color-success);
    }
  `,

  illustration: css`
    label: StatusPanel-illustration;
    margin-bottom: 1rem;
  `,

  action: css`
    label: StatusPanel-action;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.4rem;
  `,

  spinner: css`
    label: StatusPanel-spinner;
    width: 1.4rem;
    height: 1.4rem;
    border: 3px solid color-mix(in srgb, var(--color-primary) 24%, transparent);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: ${spinKeyframes} 800ms linear infinite;
  `,
};

type StatusPanelProps = {
  title: string;
  description: string;
  tone?: 'neutral' | 'error' | 'success';
  isBusy?: boolean;
  action?: ReactNode;
  /** 오류일 때 위에 두는 오리 그림. 없는 페이지처럼 상황에 맞는 그림이 있으면 바꾼다. */
  illustration?: StateIllustrationName;
};

const toneClassNames: Record<NonNullable<StatusPanelProps['tone']>, string> = {
  neutral: '',
  error: '',
  success: styles.success,
};

const StatusPanel = ({
  title,
  description,
  tone = 'neutral',
  isBusy = false,
  action,
  illustration = 'error',
}: StatusPanelProps) => (
  <main className={styles.page}>
    <section
      className={`${styles.panel} ${toneClassNames[tone]}`}
      aria-live={isBusy ? 'polite' : undefined}
      aria-busy={isBusy || undefined}
    >
      {tone === 'error' && !isBusy ? (
        <StateIllustration name={illustration} size={8.5} className={styles.illustration} />
      ) : (
        <div className={styles.mark} aria-hidden="true">
          {isBusy ? <span className={styles.spinner} /> : tone === 'success' ? '✓' : '·'}
        </div>
      )}
      <h1>{title}</h1>
      <p>{description}</p>
      {action === undefined ? null : <div className={styles.action}>{action}</div>}
    </section>
  </main>
);

export default StatusPanel;
