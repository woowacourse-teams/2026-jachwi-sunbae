import { Link } from 'react-router-dom';

import { LANDING_PATH, landingEntryState, MY_PATH } from '@/shared/lib/navigation/appPaths';
import Icon from '@/shared/ui/icon/Icon';

import * as styles from '../my-row-card/MyRowCard.styles';

/** 서비스 소개(랜딩)로 가는 카드. 랜딩의 돌아가기 버튼이 마이로 돌아오게 진입 위치를 함께 넘긴다. */
const LandingLinkCard = () => (
  <Link className={styles.notice} to={LANDING_PATH} state={landingEntryState('my', MY_PATH)}>
    <span className={styles.noticeIcon}>
      <Icon name="home" size={16} />
    </span>
    <span>
      <strong>자취선배 소개</strong>
      <small>어떤 서비스인지 처음 보는 사람처럼 둘러봐요.</small>
    </span>
    <Icon name="arrow-right" size={15} />
  </Link>
);

export default LandingLinkCard;
