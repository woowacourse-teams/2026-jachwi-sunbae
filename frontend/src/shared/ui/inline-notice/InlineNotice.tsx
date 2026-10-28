import { css } from '@emotion/css';
import type { ReactNode } from 'react';

import Icon from '../icon/Icon';

type InlineNoticeTone = 'info' | 'warning' | 'error';

type InlineNoticeProps = {
  children: ReactNode;
  tone?: InlineNoticeTone;
};

const InlineNotice = ({ children, tone = 'info' }: InlineNoticeProps) => (
  <div className={`${styles.notice} ${styles[tone]}`} role={tone === 'error' ? 'alert' : undefined}>
    <Icon name="info" size={17} />
    <span>{children}</span>
  </div>
);

const styles = {
  notice: css`
    label: InlineNotice-notice;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 0.55rem;
    padding: 0.8rem 0.9rem;
    border-radius: var(--radius-sm);
    font-size: 0.76rem;
    line-height: 1.5;

    & svg {
      margin-top: 0.05rem;
    }
  `,

  info: css`
    label: InlineNotice-info;
    background: var(--color-surface-muted);
    color: var(--color-ink-soft);
  `,

  warning: css`
    label: InlineNotice-warning;
    background: var(--color-warning-surface);
    color: var(--color-warning-ink);
  `,

  error: css`
    label: InlineNotice-error;
    background: var(--color-error-surface);
    color: var(--color-error);
  `,
};

export default InlineNotice;
