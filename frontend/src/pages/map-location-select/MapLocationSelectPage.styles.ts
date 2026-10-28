import { css } from '@emotion/css';

export const page = css`
  label: MapLocationSelectPage-page;
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
  label: MapLocationSelectPage-mapNavigation;
  z-index: 40;
  margin: 0;
  padding: 0 1rem;
  background: var(--color-surface);
`;

export const mapStage = css`
  label: MapLocationSelectPage-mapStage;
  position: relative;
  width: 100%;
  height: auto;
  min-height: 0;
  margin-left: 0;
  overflow: hidden;
  box-sizing: border-box;

  & form[role='search'],
  & form[role='search'] input,
  & form[role='search'] button {
    font-size: 0.875rem;
  }
`;
