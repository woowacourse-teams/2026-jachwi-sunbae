import { css, keyframes } from '@emotion/css';

import ActionCard, { ActionCardIllustration } from '@/shared/ui/action-card/ActionCard';

import cardNeighborhood from '../assets/card-neighborhood.webp';
import guideGoose from '../assets/guide-goose.webp';
import RecordCard from './RecordCard';

/** 홈의 주요 기능 카드: 왼쪽 큰 매물 기록 카드, 오른쪽 사용방법·동네 찾기 카드. 시설·거리 메모 지도는 매물 기록 안에 있다. */
const HomeFeatures = ({ className }: { className?: string }) => (
  <section className={`${styles.features} ${className ?? ''}`.trim()} aria-label="자취선배 주요 기능">
    <div className={styles.column}>
      <RecordCard className={styles.fill} />
    </div>
    <div className={styles.column}>
      <ActionCard
        tone="informative"
        title={
          <>
            사용방법 <br className={styles.mobileBreak} />
            알아보기
          </>
        }
        aria-label="사용방법 알아보기"
        to="/guide"
        className={styles.guide}
        illustration={<ActionCardIllustration src={guideGoose} width={200} height={294} placement="peek" />}
      />
      <ActionCard
        title="동네 찾기"
        description="통근 시간과 월세 평균을 비교해요"
        aria-label="동네 정보 찾기"
        to="/neighborhoods"
        className={styles.fill}
        illustration={<ActionCardIllustration src={cardNeighborhood} width={320} height={320} />}
      />
    </div>
  </section>
);

const guidePeekKeyframes = keyframes`
  from {
    transform: translateY(110%);
  }
  to {
    transform: translateY(0);
  }
`;

const styles = {
  /* 왼쪽 매물 기록 카드와 오른쪽 사용방법·동네 찾기 카드 묶음은 위아래 끝을 맞춰 같은 높이로 둔다. */
  /* 휴대폰 카드 글자는 기본보다 키우고, 대표 카드 글자는 조금 아래로 내린다. */
  features: css`
    label: HomeFeatures-features;
    --action-card-title-size: 1.2rem;
    --action-card-description-size: 0.78rem;
    --action-card-text-inset: 1.25rem;
    --action-card-large-text-inset: 1.5rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
    /* 오른쪽 열이 사용방법·동네 찾기 두 장이라, 세 장일 때(27rem)보다 낮춰 카드가 길게 늘어나지 않게 한다. */
    height: 19rem;
    margin-top: 1.4rem;

    @media (max-width: 360px) {
      height: 17rem;
    }

    @media (min-width: 768px) {
      --action-card-title-size: 1.5rem;
      --action-card-description-size: 0.95rem;
      --action-card-large-title-size: 2.3rem;
      --action-card-large-description-size: 1.05rem;
      --action-card-text-inset: 1.6rem;
      --action-card-large-text-inset: 1.6rem;
      height: 30rem;
    }
  `,

  column: css`
    label: HomeFeatures-column;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    min-width: 0;
    min-height: 0;
  `,

  fill: css`
    label: HomeFeatures-fill;
    flex: 1;
  `,

  guide: css`
    label: HomeFeatures-guide;
    flex: 0 0 5.2rem;

    /* 사용방법 카드의 오리는 처음 그려질 때 카드 아래 밖에 있다가 고개를 내밀며 들어온다. */
    & img {
      animation: ${guidePeekKeyframes} 560ms cubic-bezier(0.22, 1, 0.36, 1) 300ms 1 backwards;
    }

    @media (prefers-reduced-motion: reduce) {
      & img {
        animation: none;
      }
    }
  `,

  mobileBreak: css`
    label: HomeFeatures-mobileBreak;

    /* 태블릿 너비부터는 카드가 넓어지므로 카드 글자를 키워 작아 보이지 않게 하고, 사용방법 제목은 한 줄로 둔다. */
    @media (min-width: 768px) {
      display: none;
    }
  `,
};

export default HomeFeatures;
