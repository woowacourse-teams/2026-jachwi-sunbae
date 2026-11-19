import { css } from '@emotion/css';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { LOGO_DUCK } from '@/shared/assets/imageAssets';
import { HOME_PATH } from '@/shared/lib/navigation/appPaths';

import MapProfileLink from '../map-profile-link/MapProfileLink';

type Props = {
  leading?: ReactNode;
  /** 가운데 칸. 지도 보기에서는 길쭉한 검색창, 리스트 보기에서는 날씨 안내를 둔다. 왼쪽 칸이 비면 왼쪽 끝부터 채운다. */
  center?: ReactNode;
  /** 켜면 오른쪽 마이 링크를 두지 않는다. 동네 찾기는 마이 대신 왼쪽 뒤로가기로 내 기록에 돌아간다. */
  hideProfile?: boolean;
};
export const MapHomeLink = () => (
  <Link to={HOME_PATH} aria-label="자취선배 홈" className={styles.logo}>
    <img src={LOGO_DUCK.src} srcSet={`${LOGO_DUCK.src} 1x, ${LOGO_DUCK.src2x} 2x`} alt="" width={44} height={44} />
  </Link>
);
const MobileMapHeader = ({ leading, center, hideProfile = false }: Props) => (
  <header className={styles.header} aria-label="지도 목록 헤더">
    <div className={styles.leading}>{leading}</div>
    <div className={styles.space}>{center}</div>
    {!hideProfile && (
      <div className={styles.actions}>
        <MapProfileLink />
      </div>
    )}
  </header>
);
const styles = {
  header: css`
    label: MobileMapHeader-root;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 2.75rem;
    pointer-events: auto;
  `,
  /* 왼쪽 칸이 비면 가운데 칸(날씨 안내 등)을 왼쪽에 붙인다. */
  leading: css`
    &:empty {
      display: none;
    }
    &:empty + * {
      justify-content: flex-start;
    }
  `,
  actions: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
  `,
  logo: css`
    display: block;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: var(--radius-md);
    overflow: hidden;

    & img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `,
  space: css`
    label: MobileMapHeader-space;
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: center;
  `,
};
export default MobileMapHeader;
