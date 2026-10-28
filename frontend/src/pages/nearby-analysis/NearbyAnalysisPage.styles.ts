import { css } from '@emotion/css';

export const page = css`
  label: NearbyAnalysisPage-page;
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  background: var(--color-surface);
`;

export const mapNavigation = css`
  label: NearbyAnalysisPage-mapNavigation;
  z-index: 40;
  margin: 0;
  padding: 0 1rem;
  background: var(--color-surface);
`;

export const fullState = css`
  label: NearbyAnalysisPage-fullState;
  display: grid;
  align-content: center;
  gap: 1rem;
  min-height: 0;
  padding: 1rem;
`;
