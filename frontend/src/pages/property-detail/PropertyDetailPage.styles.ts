import { css } from '@emotion/css';

export const page = css`
  label: PropertyDetailPage-page;
  min-height: 100dvh;
  background: var(--color-canvas);

  /* 패널로 열면 패널 높이 안에서 스크롤하므로 화면 높이를 채우지 않는다. */
  &[data-panel='true'] {
    min-height: 0;
  }
`;

export const container = css`
  label: PropertyDetailPage-container;
  --page-inline-padding: 1rem;
  padding: 0 var(--page-inline-padding) 1.5rem;
`;

export const header = css`
  label: PropertyDetailPage-header;
  position: relative;
  display: flex;
  min-height: 3.5rem;
  align-items: center;
  gap: 0.5rem;

  & > details > summary {
    width: 2.5rem;
    height: 2.5rem;
  }
`;

export const backButton = css`
  label: PropertyDetailPage-backButton;
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  padding: 0;
  background: transparent;
  color: var(--color-ink);
  text-decoration: none;
  cursor: pointer;
`;

/* 헤더 제목은 뒤로가기 화살표 바로 오른쪽에 왼쪽 정렬로 둔다. */
export const headerTitle = css`
  label: PropertyDetailPage-headerTitle;
  min-width: 0;
  flex: 1;
  margin: 0;
  overflow: hidden;
  color: var(--color-ink);
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const tabs = css`
  label: PropertyDetailPage-tabs;
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 0 -1rem;
  padding: 0 1rem;
  background: var(--color-surface);

  & button {
    min-height: 3rem;
    border: 0;
    background: transparent;
    color: #a2a4a9;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  & button[aria-selected='true'] {
    color: var(--color-ink);
  }
`;

export const infoPanel = css`
  label: PropertyDetailPage-infoPanel;
  position: relative;
  z-index: 1;
  margin: -2rem -1rem 0;
  padding: 0 1rem 1.5rem;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--color-surface);

  & > section[aria-label='매물 기본 정보'],
  & > section[aria-label='매물 부가 정보'] {
    margin-bottom: 0.5rem;
  }
`;

export const titleRow = css`
  label: PropertyDetailPage-titleRow;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  padding: 1.25rem 0 0.8rem;

  & > details > summary {
    width: 2rem;
    height: 2rem;
  }
`;

export const infoTitle = css`
  label: PropertyDetailPage-infoTitle;
  min-width: 0;
  flex: 1;
  margin: 0;
  color: var(--color-ink);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.3;
`;

export const deleteError = css`
  label: PropertyDetailPage-deleteError;
  margin: 0.75rem 0 0;
  color: var(--color-error);
  font-size: 0.78rem;
  line-height: 1.5;
`;
