import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './IconButton.module.css';

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

export default IconButton;
