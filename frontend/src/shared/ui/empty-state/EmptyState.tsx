import { css } from '@emotion/css';
import type { ReactNode } from 'react';

import type { IconName } from '../icon/Icon';
import Icon from '../icon/Icon';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconName;
  variant?: 'card' | 'plain';
};

const EmptyState = ({ title, description, action, icon = 'inbox', variant = 'card' }: EmptyStateProps) => (
  <section
    className={variant === 'plain' ? `${styles.emptyState} ${styles.plain}` : styles.emptyState}
    data-variant={variant}
  >
    <span className={styles.icon} aria-hidden="true">
      <Icon name={icon} size={26} />
    </span>
    <strong>{title}</strong>
    <p>{description}</p>
    {action !== undefined && <div className={styles.action}>{action}</div>}
  </section>
);

const styles = {
  emptyState: css`
    label: EmptyState-emptyState;
    display: grid;
    min-height: 15rem;
    align-content: center;
    justify-items: center;
    gap: 0.65rem;
    padding: 2rem 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    text-align: center;

    & strong {
      color: var(--color-ink);
      font-size: 1rem;
    }

    & p {
      max-width: 17rem;
      margin: 0;
      color: var(--color-muted);
      font-size: 0.8rem;
      line-height: 1.55;
    }
  `,

  plain: css`
    label: EmptyState-plain;
    min-height: 10rem;
    padding: 1.25rem 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  `,

  icon: css`
    label: EmptyState-icon;
    display: grid;
    width: 3.4rem;
    height: 3.4rem;
    margin-bottom: 0.25rem;
    border-radius: 50%;
    background: var(--color-surface-muted);
    color: var(--color-primary-dark);
    place-items: center;
  `,

  action: css`
    label: EmptyState-action;
    margin-top: 0.5rem;
  `,
};

export default EmptyState;
