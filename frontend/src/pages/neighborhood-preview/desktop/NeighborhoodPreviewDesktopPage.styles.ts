import { css } from '@emotion/css';

/* 데스크탑 동네 찾기. 공용 틀(NeighborhoodPreviewPage.module.css) 위에 덧씌운다. */
export const page = css`
  label: NeighborhoodPreviewDesktopPage-page;
  /* 지도 왼쪽 위 색상 기준 상자 아래에 상세 닫기 버튼을 둔다. */
  --list-detail-close-top: 5rem;
  overflow: hidden;
`;

export const areaPanel = css`
  label: NeighborhoodPreviewDesktopPage-areaPanel;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 1.5rem;
`;

export const areaHeader = css`
  label: NeighborhoodPreviewDesktopPage-areaHeader;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;

  & h2 {
    margin: 0;
    font-size: 1.1rem;
    letter-spacing: -0.02em;
  }

  & p {
    margin: 0.3rem 0 0;
    color: var(--color-muted);
    font-size: 0.8rem;
  }
`;

export const reselect = css`
  label: NeighborhoodPreviewDesktopPage-reselect;
  flex: none;
  padding: 0.45rem 0.7rem;
  font-size: 0.75rem;
  white-space: nowrap;

  & > span {
    gap: 0.3rem;
  }
`;

export const criteria = css`
  label: NeighborhoodPreviewDesktopPage-criteria;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;

  & > span,
  & select {
    padding: 0.4rem 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: white;
    color: var(--color-ink);
    font-size: 0.75rem;
  }

  & select {
    cursor: pointer;
  }
`;

export const areaList = css`
  label: NeighborhoodPreviewDesktopPage-areaList;
  display: grid;
  gap: 0.6rem;
`;

export const empty = css`
  label: NeighborhoodPreviewDesktopPage-empty;
  margin: 0.5rem 0 0;
  color: var(--color-ink-soft);
  font-size: 0.9rem;
`;

export const legend = css`
  label: NeighborhoodPreviewDesktopPage-legend;
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 31;
`;

export const recordAction = css`
  label: NeighborhoodPreviewDesktopPage-recordAction;
  right: auto;
  width: min(24rem, calc(100% - 2rem));
`;
