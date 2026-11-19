import { css } from '@emotion/css';
import { Outlet } from 'react-router-dom';

import { HOME_PATH } from '@/shared/lib/navigation/appPaths';
import AppBar from '@/shared/ui/app-bar/AppBar';

import type { AppShellState } from '../appShell';
import { appShellAttributes } from '../appShell';

import * as shared from '../PropertyAppLayout.styles';

type Props = {
  shell: AppShellState;
  /** 화면이 자체 뒤로가기를 쓰거나 전체 화면이라 홈으로 가는 상단 바를 두지 않는지 */
  hidesAppBar: boolean;
};

/**
 * 데스크탑 앱 셸. 방 비교, 사용방법처럼 지도 밖 화면을 그리고, 위에 홈(지도)으로 돌아가는 상단 바를 둔다.
 * 다른 화면으로 가는 메뉴는 마이페이지의 바로가기 목록에 있다.
 */
const PropertyAppDesktopLayout = ({ shell, hidesAppBar }: Props) => (
  <div className={`${shared.root} ${styles.root}`} {...appShellAttributes(shell)}>
    {!hidesAppBar && <AppBar backTo={HOME_PATH} backLabel="홈으로 돌아가기" />}
    <div className={`${shared.content} ${styles.content}`}>
      <Outlet />
    </div>
  </div>
);

const styles = {
  /*
   * 데스크탑은 화면 전체 폭에 공용 헤더를 두고, 지도가 아닌 화면의 내용만 48rem 가운데 열에 둔다.
   * 기준 글자 크기(rem)는 125%로 올린다. 공용 데스크탑 헤더는 글자 크기를 px로 고정해 이 배율의 영향을 받지 않는다.
   */
  root: css`
    label: PropertyAppDesktopLayout-root;

    &[data-design-shell='true'] {
      width: 100%;
      background: var(--color-canvas);
    }

    html:has(&[data-design-shell='true']:not([data-map-page='true'])) {
      font-size: 125%;
    }
  `,

  /* 홈과 같은 폭을 쓰는 화면(마이)은 폭을 스스로 정한다. */
  content: css`
    label: PropertyAppDesktopLayout-content;

    .PropertyAppLayout-root[data-design-shell='true']:not([data-map-page='true']):not([data-home-width-page='true'])
      &
      > * {
      width: min(100%, 48rem);
      margin-right: auto;
      margin-left: auto;
    }
  `,
};

export default PropertyAppDesktopLayout;
