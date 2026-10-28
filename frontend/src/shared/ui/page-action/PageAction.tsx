import { css } from '@emotion/css';
import type { ComponentType, ReactNode } from 'react';
import type { LinkProps } from 'react-router-dom';
import { Link } from 'react-router-dom';

import type { IconProps } from '../icon/IconBase';
import { CloseIcon, MapIcon, PlusIcon } from '../icon/icons';

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

const styles = {
  action: css`
    label: PageAction-action;
    border: 0;
    cursor: pointer;
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    padding: 0.65rem 1rem;
    border-radius: 999px;
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-size: 0.76rem;
    font-weight: 800;
    text-decoration: none;
    box-shadow: 0 0.35rem 0.9rem rgb(45 51 38 / 18%);

    &:hover {
      background: var(--color-primary-dark);
    }

    &:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--color-focus) 24%, transparent);
      outline-offset: 2px;
    }
  `,

  floating: css`
    label: PageAction-floating;
    position: fixed;
    z-index: 35;
    right: max(1rem, calc((100vw - var(--app-max-width)) / 2 + 1rem));
    bottom: calc(var(--bottom-navigation-height) + 2.1rem + env(safe-area-inset-bottom));
  `,

  inline: css`
    label: PageAction-inline;
    position: static;
    box-shadow: none;
  `,
};

export default PageAction;
