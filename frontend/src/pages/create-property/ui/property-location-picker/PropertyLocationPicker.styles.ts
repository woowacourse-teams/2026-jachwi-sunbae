import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.PropertyLocationPicker-section`로 가리킨다.
export const section = cx(
  css`
    label: PropertyLocationPicker-section;
    order: 1;
    margin: 0 -1.25rem;
    padding: 0.8rem 1.25rem 1rem;
    border-top: 1px solid var(--color-border, #eaebed);
    border-bottom: 1px solid var(--color-border, #eaebed);
    background: var(--color-surface, #fff);
  `,
  'PropertyLocationPicker-section',
);

export const locationHeader = css`
  label: PropertyLocationPicker-locationHeader;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.65rem;

  & strong {
    color: var(--color-ink, #212124);
    font-size: 0.92rem;
  }

  & button {
    padding: 0.35rem 0.55rem;
    border: 1px solid var(--color-border, #eaebed);
    border-radius: 999px;
    background: transparent;
    color: var(--color-primary-dark, #536d2d);
    font: inherit;
    font-size: 0.72rem;
    font-weight: 700;
  }
`;

export const currentLocationButton = css`
  label: PropertyLocationPicker-currentLocationButton;
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--color-border, #eaebed);
  border-radius: 50%;
  background: var(--color-surface, #fff);
  color: var(--color-primary-dark, #536d2d);
  cursor: pointer;
`;

export const addressSearchArea = css`
  label: PropertyLocationPicker-addressSearchArea;
  position: relative;
  margin-bottom: 0.65rem;
`;

export const searchStatus = css`
  label: PropertyLocationPicker-searchStatus;
  margin: 0.35rem 0 0;
  color: var(--color-muted, #868b94);
  font-size: 0.75rem;
`;

export const searchResults = css`
  label: PropertyLocationPicker-searchResults;
  position: absolute;
  z-index: 2;
  top: calc(100% + 0.25rem);
  right: 0;
  left: 0;
  max-height: 10rem;
  margin: 0;
  padding: 0.25rem;
  overflow: auto;
  border: 1px solid var(--color-border, #eaebed);
  border-radius: var(--radius-sm, 0.65rem);
  background: var(--color-surface, #fff);
  box-shadow: 0 0.5rem 1.25rem rgb(0 0 0 / 10%);
  list-style: none;

  & button {
    width: 100%;
    padding: 0.65rem;
    border: 0;
    border-radius: 0.45rem;
    background: transparent;
    color: var(--color-ink, #212124);
    font: inherit;
    font-size: 0.78rem;
    text-align: left;
    cursor: pointer;
  }

  & button:hover,
  & button:focus-visible {
    background: var(--color-surface-muted, #f7f7f7);
  }
`;

export const mapPreview = css`
  label: PropertyLocationPicker-mapPreview;
  position: relative;
  width: calc(100% + 2.5rem);
  height: 12rem;
  margin-left: -1.25rem;
  overflow: hidden;
  border-radius: 0;

  & > div {
    min-height: 0;
  }
`;

export const selectedAddress = css`
  label: PropertyLocationPicker-selectedAddress;
  margin: 0.65rem 0 0;
  color: var(--color-ink-soft, #5d6455);
  font-size: 0.82rem;
  font-weight: 650;
  line-height: 1.45;
`;

export const errorNotice = css`
  label: PropertyLocationPicker-errorNotice;
  margin: 0;
  color: var(--color-error, #e53e3e);
  font-size: 0.8rem;
  font-weight: 600;

  .PropertyLocationPicker-section & {
    margin-top: 0.35rem;
  }
`;
