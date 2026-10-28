import { css } from '@emotion/css';

import ProgressCircle from '@/shared/ui/progress-circle/ProgressCircle';

const RouteLoading = () => (
  <div className={styles.loading}>
    <ProgressCircle />
  </div>
);

const styles = {
  loading: css`
    label: RouteLoading-loading;
    height: 100%;
    min-height: 12rem;
    display: grid;
    place-items: center;
  `,
};

export default RouteLoading;
