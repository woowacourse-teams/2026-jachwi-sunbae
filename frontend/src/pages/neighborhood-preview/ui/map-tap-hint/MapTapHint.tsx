import { css, keyframes } from '@emotion/css';

/**
 * 위치를 고르기 전 화면 아래에 지도를 누르라는 안내를 띄운다. 처음 온 사람이 지도를 눌러야 하는지 몰라 멈추는 일이 많아서,
 * 한 번 보고 닫는 안내 대신 위치를 고를 때까지 매번 띄운다. 지도 위 한 점에 두면 확대·이동해도 따라와 마커처럼 보이므로,
 * 지도와 무관한 화면 띠에 두고 누르는 동작은 띠 안의 아이콘으로 보여준다. 클릭은 지도로 그대로 흘려보낸다.
 * `centered`를 주면 화면 세로 가운데에 둔다. 휴대폰은 아래에 조건 시트가 늘 떠 있어 아래 띠가 가려진다.
 */
const MapTapHint = ({ centered = false }: { centered?: boolean }) => (
  <div className={styles.hint} data-centered={centered || undefined}>
    <span className={styles.tap} aria-hidden="true">
      <i />
    </span>
    <p role="note">
      <strong>지도를 눌러 출퇴근 장소를 찍어보세요</strong>
      <small>위 검색창에서 학교·회사를 찾아도 돼요</small>
    </p>
  </div>
);

const rippleKeyframes = keyframes`
  from {
    opacity: 0.9;
    transform: scale(0.5);
  }
  to {
    opacity: 0;
    transform: scale(1.3);
  }
`;

const pressKeyframes = keyframes`
  0%,
  100% {
    transform: scale(1);
  }
  20% {
    transform: scale(0.7);
  }
  40% {
    transform: scale(1);
  }
`;

const styles = {
  hint: css`
    label: MapTapHint-hint;
    position: absolute;
    right: 1rem;
    bottom: calc(var(--map-sheet-bottom, env(safe-area-inset-bottom)) + 1rem);
    left: 1rem;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    max-width: 27rem;
    margin: 0 auto;
    padding: 0.85rem 1rem;
    border-radius: 0.9rem;
    background: rgb(37 40 45 / 92%);
    color: white;
    box-shadow: 0 4px 16px rgb(0 0 0 / 18%);
    pointer-events: none;

    &[data-centered='true'] {
      top: 50%;
      bottom: auto;
      transform: translateY(-50%);
    }

    & p {
      display: grid;
      gap: 0.2rem;
      margin: 0;
    }

    & strong {
      font-size: 0.9rem;
    }

    & small {
      color: rgb(255 255 255 / 75%);
      font-size: 0.72rem;
    }
  `,

  tap: css`
    label: MapTapHint-tap;
    position: relative;
    flex: none;
    width: 2.5rem;
    height: 2.5rem;

    &::before,
    & i {
      position: absolute;
      inset: 0;
      border-radius: 50%;
    }

    /* 바깥 고리는 퍼져 나가고, 가운데 점은 눌리듯 작아졌다 돌아온다. */
    &::before {
      content: '';
      border: 2px solid var(--color-brand-yellow);
      animation: ${rippleKeyframes} 1.6s ease-out infinite;
    }

    & i {
      inset: 0.75rem;
      background: var(--color-brand-yellow);
      animation: ${pressKeyframes} 1.6s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      &::before,
      & i {
        animation: none;
      }
    }
  `,
};

export default MapTapHint;
