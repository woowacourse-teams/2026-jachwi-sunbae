import { css, keyframes } from '@emotion/css';

import ActionCard, { ActionCardIllustration } from '@/shared/ui/action-card/ActionCard';

import guideGoose from '../assets/guide-goose.webp';

/** 홈 맨 위의 사용방법 카드. 기능 카드 묶음 위에 한 줄로 두고, 오른쪽 끝에서 오리가 고개를 내민다. */
const GuideCard = ({ className }: { className?: string }) => (
  <ActionCard
    title="사용방법 알아보기"
    aria-label="사용방법 알아보기"
    to="/guide"
    className={`${styles.guide} ${className ?? ''}`.trim()}
    illustration={<ActionCardIllustration src={guideGoose} width={200} height={294} placement="peek" />}
  />
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
  /* 기능 카드 묶음 밖에 있으므로 카드 글자 크기·여백을 묶음과 같게 직접 정한다. */
  guide: css`
    label: GuideCard-guide;
    --action-card-title-size: 1.2rem;
    --action-card-text-inset: 1.25rem;
    height: 5.2rem;
    /* 흰 오리가 회색 카드에 묻히지 않게, 오리가 고개를 내미는 오른쪽 아래에 옅은 파란빛을 깐다. */
    background:
      radial-gradient(
        circle 6.5rem at right 2.5rem top 72%,
        color-mix(in srgb, var(--color-brand-blue) 50%, transparent),
        color-mix(in srgb, var(--color-brand-blue) 18%, transparent) 55%,
        transparent 100%
      ),
      var(--action-card-surface);

    /* 오리는 처음 그려질 때 카드 아래 밖에 있다가 고개를 내밀며 들어온다. */
    & img {
      animation: ${guidePeekKeyframes} 560ms cubic-bezier(0.22, 1, 0.36, 1) 300ms 1 backwards;
    }

    @media (prefers-reduced-motion: reduce) {
      & img {
        animation: none;
      }
    }

    @media (min-width: 768px) {
      --action-card-title-size: 1.5rem;
      --action-card-text-inset: 1.6rem;
    }
  `,
};

export default GuideCard;
