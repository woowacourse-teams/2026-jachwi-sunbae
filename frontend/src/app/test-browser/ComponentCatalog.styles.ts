import { css } from '@emotion/css';

export const canvas = css`
  label: ComponentCatalog-canvas;
  min-height: 100dvh;
  padding: 2rem 1rem;
  background: var(--color-canvas);

  @media (max-width: 430px) {
    padding: 0;
  }
`;

export const catalog = css`
  label: ComponentCatalog-catalog;
  width: min(100%, var(--app-max-width));
  margin: 0 auto;
  border: 1px solid var(--color-border);
  background: var(--color-surface);

  @media (max-width: 430px) {
    border: 0;
  }
`;

export const content = css`
  label: ComponentCatalog-content;
  display: grid;
  gap: 1rem;
  padding: 1rem;
`;

export const intro = css`
  label: ComponentCatalog-intro;
  padding: 1rem 0 0.5rem;

  & span {
    color: var(--color-primary-dark);
    font-size: 0.64rem;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  & h1 {
    margin: 0.45rem 0 0;
    font-size: 1.45rem;
    letter-spacing: -0.05em;
    line-height: 1.25;
  }

  & p {
    margin: 0.55rem 0 0;
    color: var(--color-muted);
    font-size: 0.78rem;
    line-height: 1.55;
  }
`;

export const section = css`
  label: ComponentCatalog-section;
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  & h2 {
    margin: 0;
    font-size: 0.76rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;

export const inlineExamples = css`
  label: ComponentCatalog-inlineExamples;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const colorGrid = css`
  label: ComponentCatalog-colorGrid;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
`;

export const colorItem = css`
  label: ComponentCatalog-colorItem;
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr);
  align-items: center;
  gap: 0.55rem;
  min-width: 0;

  & strong,
  & small {
    display: block;
  }

  & strong {
    overflow: hidden;
    font-size: 0.7rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & small {
    margin-top: 0.1rem;
    color: var(--color-muted);
    font-size: 0.62rem;
  }
`;

export const colorSwatch = css`
  label: ComponentCatalog-colorSwatch;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.55rem;
`;
