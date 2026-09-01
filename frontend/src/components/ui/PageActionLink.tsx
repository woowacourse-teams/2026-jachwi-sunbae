import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import Icon from './Icon';
import styles from './PageActionLink.module.css';

type PageActionLinkProps = Omit<LinkProps, 'children'> & {
  children: ReactNode;
  icon?: 'plus' | 'map';
  placement?: 'floating' | 'inline';
};

const PageActionLink = ({
  children,
  icon = 'plus',
  placement = 'floating',
  className,
  ...props
}: PageActionLinkProps) => (
  <Link {...props} className={[styles.action, styles[placement], className ?? ''].filter(Boolean).join(' ')}>
    <Icon name={icon} size={17} />
    <span>{children}</span>
  </Link>
);

export default PageActionLink;
