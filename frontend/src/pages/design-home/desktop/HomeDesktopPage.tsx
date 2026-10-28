import { css, cx } from '@emotion/css';

import DesktopHeader from '@/shared/ui/desktop-header/DesktopHeader';

import HomeFeatures from '../ui/HomeFeatures';
import HomeFooter from '../ui/HomeFooter';
import QuickMenu from '../ui/QuickMenu';
import RecentRooms from '../ui/RecentRooms';

import * as shared from '../HomePage.styles';

/** 데스크탑 홈. 다른 화면과 같은 공용 헤더를 쓰고, 기능 카드 옆 오른쪽 열에 빠른 메뉴·최근 기록을 둔다. */
const HomeDesktopPage = () => (
  <main className={`${shared.page} ${styles.root}`}>
    <DesktopHeader />
    <div className={styles.layout}>
      <p className={`${shared.tip} ${styles.tip}`}>계약 전, 놓친 문제는 없는지 확인해보세요.</p>
      <HomeFeatures className={styles.features} />
      <div className={styles.side}>
        <QuickMenu />
        {/* 최근 기록한 방은 상세로 넘어가지 않고 본 방 기록 화면에서 고른 상태로 연다. */}
        <RecentRooms inSideColumn />
      </div>
    </div>
    <HomeFooter className={styles.footer} alignStart />
  </main>
);

const styles = {
  /*
   * 데스크탑 홈: 공용 헤더 아래 본문을 64rem 안에 두고, 안내 문구는 두 열 전체 폭(2/3로 줄여 가운데),
   * 그 아래 왼쪽에 기능 카드, 오른쪽 19rem 열에 빠른 메뉴와 최근 기록을 둔다.
   */
  layout: css`
    label: HomeDesktopPage-layout;
    display: grid;
    grid-template-areas:
      'tip tip'
      'features side';
    grid-template-columns: minmax(0, 1fr) 19rem;
    align-items: start;
    column-gap: 2rem;
    width: min(100%, 64rem);
    margin: 0 auto;
    padding: 0 2rem;
    box-sizing: border-box;
  `,

  // 다른 요소의 선택자에서 `.HomeDesktopPage-root`로 가리킨다.
  root: cx(
    css`
      label: HomeDesktopPage-root;
    `,
    'HomeDesktopPage-root',
  ),

  tip: css`
    label: HomeDesktopPage-tip;

    .HomeDesktopPage-root & {
      grid-area: tip;
      justify-self: center;
      width: calc(100% * 2 / 3);
      text-align: center;
    }
  `,

  features: css`
    label: HomeDesktopPage-features;
    grid-area: features;
  `,

  /* 오른쪽 열은 기능 카드 위쪽에 맞춰 시작하고, 타일은 사용방법 카드 높이를 넘지 않게 한다. */
  side: css`
    label: HomeDesktopPage-side;
    grid-area: side;
    margin-top: 1.4rem;

    & > nav {
      grid-template-columns: repeat(2, minmax(0, 5rem));
      margin-top: 0;
    }

    /* 아직 기능이 없는 빠른 메뉴 빈칸은 오른쪽 열에서 그리지 않는다. */
    & > nav > [aria-hidden='true'] {
      display: none;
    }
  `,

  footer: css`
    label: HomeDesktopPage-footer;
    width: min(100%, 64rem);
    margin-right: auto;
    margin-left: auto;
    padding-right: 2rem;
    padding-left: 2rem;
  `,
};

export default HomeDesktopPage;
