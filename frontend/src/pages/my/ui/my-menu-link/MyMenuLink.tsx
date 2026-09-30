import { Link } from 'react-router-dom';

import Icon, { type IconName } from '@/shared/ui/icon/Icon';

import styles from './MyMenuLink.module.css';

type MyMenuLinkProps = {
  to: string;
  icon: IconName;
  label: string;
};

const MyMenuLink = ({ to, icon, label }: MyMenuLinkProps) => (
  <Link className={styles.link} to={to}>
    <span className={styles.menuIcon}>
      <Icon name={icon} size={15} />
    </span>
    <strong>{label}</strong>
    <Icon name="arrow-right" size={15} />
  </Link>
);

export default MyMenuLink;
