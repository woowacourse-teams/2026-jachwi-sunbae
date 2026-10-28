import { css } from '@emotion/css';

export const presetStatus = css`
  label: ChecklistPresetStatus-presetStatus;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: var(--color-ink-soft);
  font-size: 0.78rem;
`;

export const presetError = css`
  label: ChecklistPresetStatus-presetError;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: var(--color-ink-soft);
  font-size: 0.78rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 0.65rem 0;
  color: var(--color-error);

  & > div {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
  }

  & strong,
  & span {
    overflow-wrap: anywhere;
  }

  & button {
    min-height: 2.5rem;
    padding: 0.4rem 0.5rem;
    white-space: nowrap;
  }
`;
