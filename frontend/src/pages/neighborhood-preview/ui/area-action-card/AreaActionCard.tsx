import { css } from '@emotion/css';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import Icon from '@/shared/ui/icon/Icon';

type AreaActionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  /** 외부 주소는 새 탭으로, 서비스 안 경로는 라우터로 연다. */
  link: { href: string } | { to: string };
  className?: string;
  onOpen?: () => void;
};

/** 동네 하나에 대한 다음 행동을 아이콘·제목·설명 카드로 보여준다. */
const AreaActionCard = ({ icon, title, description, link, className, onOpen }: AreaActionCardProps) => {
  const cardClassName = [styles.card, className].filter(Boolean).join(' ');
  const content = (
    <>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className={styles.trailing} aria-hidden="true">
        <Icon name={'href' in link ? 'external-link' : 'chevron-right'} size={20} />
      </span>
    </>
  );
  return 'href' in link ? (
    <a className={cardClassName} href={link.href} target="_blank" rel="noopener noreferrer" onClick={onOpen}>
      {content}
    </a>
  ) : (
    <Link className={cardClassName} to={link.to} onClick={onOpen}>
      {content}
    </Link>
  );
};

const styles = {
  card: css`
    label: AreaActionCard-card;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--color-border-strong);
    border-radius: 1rem;
    background: var(--color-surface);
    color: var(--color-ink);
    text-decoration: none;

    &:hover {
      background: var(--color-surface-muted);
    }
  `,

  icon: css`
    label: AreaActionCard-icon;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    overflow: hidden;
    border-radius: 0.75rem;
    background: var(--color-surface-muted);
    color: var(--color-primary);

    & img {
      width: 100%;
      height: 100%;
    }
  `,

  text: css`
    label: AreaActionCard-text;
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 0.15rem;
    text-align: left;

    & strong {
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.3;
    }

    & small {
      font-size: 0.72rem;
      line-height: 1.3;
      color: var(--color-ink-soft);
    }
  `,

  trailing: css`
    label: AreaActionCard-trailing;
    display: inline-flex;
    flex-shrink: 0;
    color: var(--color-ink-soft);
  `,
};

export default AreaActionCard;
