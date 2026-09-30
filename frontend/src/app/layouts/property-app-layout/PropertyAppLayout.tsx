import { NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom';

import type { Member } from '@/features/auth/model/Member';
import Icon from '@/shared/ui/icon/Icon';

import styles from './PropertyAppLayout.module.css';

const PropertyAppLayout = () => {
  const member = useOutletContext<Member>();
  const location = useLocation();
  const fullScreen =
    location.pathname === '/map/select-location' ||
    location.pathname.startsWith('/properties/new') ||
    location.pathname === '/checklists/new' ||
    /^\/checklists\/\d+$/.test(location.pathname) ||
    /^\/properties\/\d+\/checklists\/\d+$/.test(location.pathname);

  return (
    <div className={styles.root} data-full-screen={fullScreen || undefined}>
      <div className={styles.content}>
        <Outlet context={member} />
      </div>
      {!fullScreen && (
        <nav className={styles.bottomNavigation} aria-label="주요 메뉴">
          <NavLink to="/properties" aria-label="홈">
            <Icon name="home" size={20} />홈
          </NavLink>
          <NavLink to="/checklists" aria-label="체크리스트">
            <Icon name="checklist" size={20} />
            체크리스트
          </NavLink>
          <NavLink to="/map" aria-label="지도">
            <Icon name="map" size={20} />
            지도
          </NavLink>
          <NavLink to="/me" aria-label="마이">
            <Icon name="user" size={20} />
            마이
          </NavLink>
        </nav>
      )}
    </div>
  );
};

export default PropertyAppLayout;
