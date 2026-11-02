import { css, keyframes } from '@emotion/css';

import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';
import { HOME_PATH } from '@/shared/lib/navigation/appPaths';
import useReturnNavigation from '@/shared/lib/navigation/useReturnNavigation';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import ChecklistEditorFrame, { ChecklistDesktopHeading } from './ChecklistEditorFrame';

const ITEM_COUNT = 4;

/**
 * 체크리스트 편집 화면(`/checklists`)의 뼈대. 처음 여는 화면이라 남겨 둘 내용이 없으므로 늦추지 않고 바로 보여 준다.
 * 화면 코드를 받는 동안(Suspense fallback)과 체크리스트, 기본 항목을 받는 동안 같은 자리에 같은 뼈대를 두어,
 * 뼈대에서 편집 화면으로 한 번만 바뀐다.
 */
const ChecklistEditorSkeleton = () => {
  const isDesktop = useIsDesktop();
  const goBack = useReturnNavigation({ cameFromTarget: true, fallback: HOME_PATH });

  return (
    <ChecklistEditorFrame isDesktop={isDesktop} className={styles.page}>
      {isDesktop ? (
        <ChecklistDesktopHeading />
      ) : (
        <TopNavigation
          className={styles.topNavigation}
          title="체크리스트 편집"
          backLabel="이전 화면으로 돌아가기"
          navigationIcon="arrow-left"
          onBack={goBack}
        />
      )}
      <div className={styles.body} role="status">
        <span className="sr-only">체크리스트를 불러오는 중이에요.</span>
        <div aria-hidden="true">
          <span className={`${styles.block} ${styles.heading}`} />
          <ul className={styles.items}>
            {Array.from({ length: ITEM_COUNT }, (_, index) => (
              <li key={index} className={`${styles.block} ${styles.item}`} />
            ))}
          </ul>
        </div>
      </div>
    </ChecklistEditorFrame>
  );
};

const shimmer = keyframes`
  to {
    background-position: -200% 0;
  }
`;

const styles = {
  /* 체크리스트 편집 화면(ChecklistDetailPage)과 같은 바깥 여백 */
  page: css`
    label: ChecklistEditorSkeleton-page;
    padding-right: 1rem;
    padding-left: 1rem;
  `,

  topNavigation: css`
    label: ChecklistEditorSkeleton-topNavigation;
    margin-bottom: 0;
  `,

  body: css`
    label: ChecklistEditorSkeleton-body;
    padding: 0.75rem 0;
  `,

  block: css`
    label: ChecklistEditorSkeleton-block;
    display: block;
    border-radius: 0.6rem;
    background: linear-gradient(90deg, #eff1f5 25%, #e3e6eb 50%, #eff1f5 75%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,

  heading: css`
    label: ChecklistEditorSkeleton-heading;
    width: 40%;
    height: 1rem;
  `,

  items: css`
    label: ChecklistEditorSkeleton-items;
    display: grid;
    gap: 0.6rem;
    margin: 1rem 0 0;
    padding: 0;
    list-style: none;
  `,

  item: css`
    label: ChecklistEditorSkeleton-item;
    height: 3.5rem;
  `,
};

export default ChecklistEditorSkeleton;
