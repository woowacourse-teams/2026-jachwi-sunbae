import ProgressCircle from '@/shared/ui/progress-circle/ProgressCircle';

import * as styles from './RouteLoading.styles';

const RouteLoading = () => (
  <div className={styles.loading}>
    <ProgressCircle />
  </div>
);
export default RouteLoading;
