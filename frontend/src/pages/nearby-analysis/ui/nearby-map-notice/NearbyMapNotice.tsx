import { css } from '@emotion/css';

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

const styles = {
  notice: css`
    label: NearbyMapNotice-notice;
    position: absolute;
    top: 4.2rem;
    left: 50%;
    z-index: 20;
    display: flex;
    width: max-content;
    max-width: calc(100% - 4rem);
    align-items: center;
    gap: 0.35rem;
    margin: 0;
    padding: 0.45rem 0.75rem;
    border: 1px solid rgb(224 222 213 / 84%);
    border-radius: 999px;
    background: rgb(255 255 255 / 94%);
    box-shadow: 0 0.3rem 0.9rem rgb(44 50 39 / 14%);
    color: var(--color-ink-soft);
    font-size: 0.68rem;
    font-weight: 700;
    text-align: center;
    transform: translateX(-50%);
  `,
};

export default NearbyMapNotice;
