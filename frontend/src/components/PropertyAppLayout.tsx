import { useRef } from 'react';
import { NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import type { Member } from '../types/Member';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import Icon from './ui/Icon';
import styles from './PropertyAppLayout.module.css';

const PropertyAppLayout = () => {
  const member = useOutletContext<Member>();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const fullScreen =
    location.pathname === '/map/select-location' ||
    location.pathname.startsWith('/properties/new') ||
    location.pathname === '/checklists/new' ||
    /^\/checklists\/\d+$/.test(location.pathname) ||
    /^\/properties\/\d+\/checklists\/\d+$/.test(location.pathname);
  // 지도처럼 화면을 꽉 채우는 곳은 당김이 지도 조작과 겹쳐서 제외한다.
  const canPullToRefresh = !fullScreen && location.pathname !== '/map';
  const { pullDistance, refreshing, handlers } = usePullToRefresh(contentRef);

  return (
    <div className={styles.root} data-full-screen={fullScreen || undefined}>
      <div
        ref={contentRef}
        className={styles.content}
        style={pullDistance > 0 ? { transform: `translateY(${pullDistance}px)` } : undefined}
        {...(canPullToRefresh ? handlers : {})}
      >
        {canPullToRefresh && (pullDistance > 0 || refreshing) && (
          <div className={styles.pullIndicator} role="status" aria-live="polite">
            <span className={styles.pullSpinner} data-spinning={refreshing || undefined} />
            {refreshing ? '새로고침 중' : pullDistance >= 72 ? '놓으면 새로고침' : '당겨서 새로고침'}
          </div>
        )}
        <Outlet context={member} />
      </div>
      {!fullScreen && (
        <nav className={styles.bottomNavigation} aria-label="주요 메뉴">
          <NavLink to="/properties" aria-label="홈">
            <Icon name="home" size={16} />홈
          </NavLink>
          <NavLink to="/checklists" aria-label="체크리스트">
            <Icon name="checklist" size={16} />
            체크리스트
          </NavLink>
          <NavLink to="/map" aria-label="지도">
            <Icon name="map" size={16} />
            지도
          </NavLink>
          <NavLink to="/me" aria-label="마이">
            <Icon name="user" size={16} />
            마이
          </NavLink>
        </nav>
      )}
    </div>
  );
};

export default PropertyAppLayout;
