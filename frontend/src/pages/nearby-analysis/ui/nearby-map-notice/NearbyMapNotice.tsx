import styles from './NearbyMapNotice.module.css';

type NearbyMapNoticeProps = {
  isPropertyPending: boolean;
  isNearbyPending: boolean;
  isNearbyError: boolean;
  onRetry: () => void;
};

const NearbyMapNotice = ({ isPropertyPending, isNearbyPending, isNearbyError, onRetry }: NearbyMapNoticeProps) => (
  <>
    {isPropertyPending && (
      <p className={styles.notice} role="status">
        매물 위치를 확인하는 중이에요.
      </p>
    )}
    {isNearbyPending && (
      <p className={styles.notice} role="status">
        주변 시설을 분석하는 중이에요.
      </p>
    )}
    {isNearbyError && (
      <div className={styles.notice} role="alert">
        주변 시설을 불러오지 못했어요.{' '}
        <button type="button" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    )}
  </>
);

export default NearbyMapNotice;
