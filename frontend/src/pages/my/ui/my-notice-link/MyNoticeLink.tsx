import { Link } from 'react-router-dom';

import Icon from '@/shared/ui/icon/Icon';

import styles from '../../MyPage.module.css';

type MyNoticeLinkProps = {
  to: string;
  title: string;
  description: string;
};

const MyNoticeLink = ({ to, title, description }: MyNoticeLinkProps) => (
  <Link className={styles.notice} to={to}>
    <span className={styles.noticeIcon}>
      <Icon name="info" size={16} />
    </span>
    <span>
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
    <Icon name="arrow-right" size={15} />
  </Link>
);

export default MyNoticeLink;
