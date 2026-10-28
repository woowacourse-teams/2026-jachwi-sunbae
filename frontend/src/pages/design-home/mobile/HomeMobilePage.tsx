import { css } from '@emotion/css';

import GuideCard from '../ui/GuideCard';
import HomeFeatures from '../ui/HomeFeatures';
import HomeFooter from '../ui/HomeFooter';
import HomeHeader from '../ui/HomeHeader';
import QuickMenu from '../ui/QuickMenu';
import RecentRooms from '../ui/RecentRooms';

import * as shared from '../HomePage.styles';

/** 휴대폰·태블릿 홈. 홈 전용 헤더 아래에 사용방법 카드·기능 카드·빠른 메뉴·최근 기록을 한 열로 쌓는다. */
const HomeMobilePage = () => (
  <main className={shared.page}>
    <HomeHeader className={styles.topBar} />
    <div className={styles.container}>
      <GuideCard className={styles.guide} />
      <HomeFeatures />
    </div>
    <div className={styles.side}>
      <QuickMenu />
      <RecentRooms />
    </div>
    <HomeFooter className={styles.footer} />
  </main>
);

const styles = {
  /* 휴대폰·태블릿 홈: 로고·사용방법 카드·기능 카드·빠른 메뉴·최근 기록을 한 열(최대 45rem)로 쌓는다. */
  topBar: css`
    label: HomeMobilePage-topBar;
    width: min(100%, 45rem);
    margin-right: auto;
    margin-left: auto;
    padding-right: 1.25rem;
    padding-left: 1.25rem;
    padding-top: max(0.85rem, env(safe-area-inset-top));

    @media (max-width: 360px) {
      padding-right: 1rem;
      padding-left: 1rem;
    }

    /* 태블릿 너비부터는 여백만 조금 넓힌다. */
    @media (min-width: 768px) {
      padding-top: max(1.25rem, env(safe-area-inset-top));
    }
  `,

  container: css`
    label: HomeMobilePage-container;
    width: min(100%, 45rem);
    margin-right: auto;
    margin-left: auto;
    padding-right: 1.25rem;
    padding-left: 1.25rem;

    @media (max-width: 360px) {
      padding-right: 1rem;
      padding-left: 1rem;
    }

    @media (min-width: 768px) {
      margin-top: 0.5rem;
    }
  `,

  side: css`
    label: HomeMobilePage-side;
    width: min(100%, 45rem);
    margin-right: auto;
    margin-left: auto;
    padding-right: 1.25rem;
    padding-left: 1.25rem;
    /* 빠른 메뉴(체크리스트·방 비교)는 위 기능 카드 묶음과 붙어 보이지 않게 간격을 더 둔다. */
    margin-top: 1.75rem;

    @media (max-width: 360px) {
      padding-right: 1rem;
      padding-left: 1rem;
    }

    @media (min-width: 768px) {
      margin-top: 2.25rem;
    }
  `,

  footer: css`
    label: HomeMobilePage-footer;
    width: min(100%, 45rem);
    margin-right: auto;
    margin-left: auto;
    padding-right: 1.25rem;
    padding-left: 1.25rem;

    @media (max-width: 360px) {
      padding-right: 1rem;
      padding-left: 1rem;
    }
  `,

  guide: css`
    label: HomeMobilePage-guide;
    margin-top: 1.2rem;
  `,
};

export default HomeMobilePage;
