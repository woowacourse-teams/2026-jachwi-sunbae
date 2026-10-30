import { css } from '@emotion/css';
import type { ReactNode } from 'react';

import PageHeading from '@/shared/ui/page-heading/PageHeading';

type Props = {
  /** 데스크탑 화면인지. 페이지가 `useIsDesktop`으로 한 번 골라 넘긴다. */
  isDesktop: boolean;
  children: ReactNode;
  /** 화면마다 다른 바깥 여백. */
  className?: string;
};

/**
 * 체크리스트 편집 화면의 틀. 휴대폰은 앱 열의 가로 폭을 그대로 쓰고, 데스크탑은 방 비교, 사용 방법처럼
 * 공용 헤더 아래 가운데 46rem 열에 둔다.
 */
const ChecklistEditorFrame = ({ isDesktop, children, className }: Props) => (
  <main className={`property-page checklist-page checklist-editor-page ${styles.page} ${className ?? ''}`.trim()}>
    <div className={isDesktop ? styles.desktopContainer : styles.container}>{children}</div>
  </main>
);

/** 데스크탑 체크리스트 편집 제목. 공용 헤더에 메뉴와 로고가 있어 휴대폰의 뒤로가기 줄 대신 왼쪽 정렬 제목을 둔다. */
export const ChecklistDesktopHeading = () => (
  <header className={styles.heading}>
    <PageHeading title="체크리스트" />
    <p>매물을 볼 때 확인할 항목과 순서를 정해요. 저장하면 새 매물에도 바로 적용돼요.</p>
  </header>
);

const styles = {
  page: css`
    label: ChecklistEditorFrame-page;
    background: var(--color-canvas);
  `,

  container: css`
    label: ChecklistEditorFrame-container;
    width: 100%;

    @media (min-width: 768px) {
      max-width: 34rem;
      margin-right: auto;
      margin-left: auto;
    }

    & > [data-full-bleed='true'] {
      margin-top: -0.15rem;
    }
  `,

  desktopContainer: css`
    label: ChecklistEditorFrame-desktopContainer;
    width: min(100%, 46rem);
    margin: 0 auto;
    padding-top: 1rem;
  `,

  heading: css`
    label: ChecklistEditorFrame-heading;
    margin-bottom: 1.25rem;

    & p {
      margin: 0;
      color: var(--color-ink-soft);
      font-size: 0.9rem;
      line-height: 1.5;
    }
  `,
};

export default ChecklistEditorFrame;
