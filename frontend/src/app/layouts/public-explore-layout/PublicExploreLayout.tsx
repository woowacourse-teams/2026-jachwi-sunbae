import { Outlet } from 'react-router-dom';

import * as styles from './PublicExploreLayout.styles';

const PublicExploreLayout = () => (
  <div className={styles.layout}>
    <Outlet />
  </div>
);
export default PublicExploreLayout;
