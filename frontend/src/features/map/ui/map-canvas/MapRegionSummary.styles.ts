import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.MapRegionSummary-summary`로 가리킨다.
export const summary = cx(
  css`
    label: MapRegionSummary-summary;
    width: 108px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #222;
    cursor: pointer;
    text-align: center;
    font-family: inherit;

    & > strong {
      display: block;
      margin-bottom: 3px;
      font-size: 11px;
      line-height: 1.2;
      text-shadow:
        0 1px 3px white,
        0 -1px 3px white;
    }
  `,
  'MapRegionSummary-summary',
);

export const cells = css`
  label: MapRegionSummary-cells;
  transition: background-color 140ms ease;
  display: grid;
  background: white;
  border: 1px solid #b8bbc0;
  border-radius: 4px;
  box-shadow: 0 2px 7px rgb(0 0 0 / 14%);
  overflow: hidden;

  .MapRegionSummary-summary:is(:hover, :focus-visible, [data-hovered='true']) & {
    background: #fff3d2;
  }

  .MapRegionSummary-summary:not([data-colored='true'])[aria-pressed='true']:is(
      :hover,
      :focus-visible,
      [data-hovered='true']
    )
    & {
    background: #ffe79a;
  }

  & > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: 5px 6px;
    line-height: 1.2;
  }

  & > span + span {
    border-top: 1px solid #e0e2e5;
  }

  & small {
    font-size: 8px;
    color: #666;
    white-space: nowrap;
  }

  & b {
    font-size: 11px;
    white-space: nowrap;
  }

  .MapRegionSummary-summary[aria-pressed='true'] & {
    background: #fff3bc;
    box-shadow:
      0 0 0 1px #969ba2,
      0 2px 7px rgb(0 0 0 / 14%);
  }

  .MapRegionSummary-summary[data-colored='true'] & {
    border-color: var(--region-accent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--region-accent) 65%, transparent);
  }

  .MapRegionSummary-summary[data-colored='true'][aria-pressed='true'] & {
    background: color-mix(in srgb, var(--region-accent) 18%, white);
  }
`;
