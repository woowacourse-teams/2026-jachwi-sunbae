import { css } from '@emotion/css';

export const panel = css`
  label: AdminLogViewer-panel;
  --log-bg: #11151c;
  --log-surface: #1b222c;
  --log-border: #343f4e;
  --log-text: #e0e6ee;
  --log-muted: #a9b6c6;
  min-width: 0;
  background: var(--log-bg);
  color: var(--log-text);
  padding: clamp(0.75rem, 2vw, 1.5rem);
  border: 1px solid var(--log-border);
  border-radius: 10px;
  & h3 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0.75rem 0;
  }
  & p {
    margin: 0.75rem 0;
  }
  && [role='alert'] {
    color: #ffb4b4;
  }
  && a {
    color: #8fc7ff;
  }
  & button:focus-visible,
  & input:focus-visible,
  & select:focus-visible {
    outline: 2px solid #8fc7ff;
    outline-offset: 3px;
  }
`;
export const filters = css`
  label: AdminLogViewer-filters;
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem 0;
  & label {
    display: grid;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  & input,
  & select {
    padding: 0.65rem;
    border: 1px solid var(--log-border);
    border-radius: 5px;
    background: var(--log-surface);
    color: var(--log-text);
  }
  & input {
    width: min(25rem, 65vw);
  }
`;
export const tableScroll = css`
  label: AdminLogViewer-tableScroll;
  max-width: 100%;
  overflow: auto;
  max-height: 36rem;
  border: 1px solid var(--log-border);
  border-radius: 5px;
  & table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    text-align: left;
    font:
      0.8rem/1.5 ui-monospace,
      monospace;
    white-space: nowrap;
  }
  & th,
  & td {
    padding: 0.45rem 0.65rem;
    border-right: 1px solid var(--log-border);
    border-bottom: 1px solid var(--log-border);
    vertical-align: top;
  }
  & th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--log-surface);
    color: var(--log-muted);
    font-weight: 600;
  }
  & tr:last-child td {
    border-bottom: 0;
  }
  & th:last-child,
  & td:last-child {
    border-right: 0;
  }
  & tbody tr:nth-child(even) {
    background: #171c25;
  }
  & tbody tr:hover,
  & tr[aria-selected='true'] {
    background: #25364b;
  }
  & tbody tr {
    cursor: pointer;
  }
`;
export const truncated = css`
  label: AdminLogViewer-truncated;
  display: block;
  max-width: 28ch;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: left;
`;
export const link = css`
  label: AdminLogViewer-link;
  border: 0;
  padding: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: #8fc7ff;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-align: left;
`;
export const badge = css`
  label: AdminLogViewer-badge;
  display: inline-block;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 0 0.35rem;
  color: #bbc7d7;
  &[data-level='P0'],
  &[data-level='5xx'] {
    color: #ffaaaa;
    background: #4a2228;
  }
  &[data-level='P1'],
  &[data-level='4xx'] {
    color: #ffd18a;
    background: #44351e;
  }
  &[data-level='P2'] {
    color: #99caff;
    background: #203952;
  }
`;
