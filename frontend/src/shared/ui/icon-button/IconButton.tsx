import { css } from '@emotion/css';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type IconButtonBaseProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

type IconButtonProps = IconButtonBaseProps & ({ to: string; onClick?: never } | { to?: never; onClick: () => void });

/** 아이콘만 넣는 동그란 보조 버튼. 이동이면 `to`, 동작이면 `onClick`을 준다. */
const IconButton = ({ label, children, className, to, onClick }: IconButtonProps) => {
  const classes = `${styles.iconButton} ${className ?? ''}`.trim();

  if (to !== undefined) {
    return (
      <Link className={classes} to={to} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
};

const styles = {
  iconButton: css`
    label: IconButton-iconButton;
    display: inline-flex;
    width: 2rem;
    height: 2rem;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid var(--color-border-strong, #d7c69e);
    border-radius: 50%;
    background: var(--color-surface, #fffdf8);
    color: var(--color-primary-dark, #455a27);
    cursor: pointer;
    text-decoration: none;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--color-primary, #6c873b);
      background: var(--color-surface-muted, #f2f3eb);
      outline: none;
    }
  `,
};

export default IconButton;
