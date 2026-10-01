import type { ComponentType, ReactNode } from 'react';
import type { LinkProps } from 'react-router-dom';
import { Link } from 'react-router-dom';

import type { IconProps } from '../icon/IconBase';
import { CloseIcon, MapIcon, PlusIcon } from '../icon/icons';

import styles from './PageAction.module.css';

type PageActionProps = {
  children: ReactNode;
  icon?: 'plus' | 'map' | 'close';
  placement?: 'floating' | 'inline';
  className?: string;
  'aria-label'?: string;
} & ({ to: LinkProps['to']; onClick?: never } | { to?: never; onClick: () => void });

const actionIcons = {
  plus: PlusIcon,
  map: MapIcon,
  close: CloseIcon,
} satisfies Record<NonNullable<PageActionProps['icon']>, ComponentType<Omit<IconProps, 'children'>>>;

/** 화면의 대표 행동 하나를 담는 알약 버튼. 이동이면 `to`, 그 자리에서 하면 `onClick`을 준다. */
const PageAction = ({
  children,
  icon = 'plus',
  placement = 'floating',
  className,
  to,
  onClick,
  ...rest
}: PageActionProps) => {
  const classes = [styles.action, styles[placement], className ?? ''].filter(Boolean).join(' ');
  const ActionIcon = actionIcons[icon];
  const content = (
    <>
      <ActionIcon size={17} />
      <span>{children}</span>
    </>
  );

  if (to !== undefined) {
    return (
      <Link {...rest} to={to} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button {...rest} type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  );
};

export default PageAction;
