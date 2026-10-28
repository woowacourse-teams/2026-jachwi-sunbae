import { css } from '@emotion/css';

export const panel = css`
  label: ConditionPanel-panel;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 1.5rem;
  background: white;

  & h2 {
    margin: 0;
    font-size: 1.1rem;
    letter-spacing: -0.02em;
  }
`;

export const place = css`
  label: ConditionPanel-place;
  display: grid;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border-radius: 0.7rem;
  background: var(--color-card-surface);

  & small {
    color: var(--color-muted);
    font-size: 0.75rem;
  }

  & strong {
    font-size: 0.95rem;
  }

  & p {
    margin: 0;
    color: var(--color-ink-soft);
    font-size: 0.85rem;
    line-height: 1.5;
  }
`;

export const addresses = css`
  label: ConditionPanel-addresses;
  display: grid;
  gap: 0.4rem;

  & p {
    margin: 0;
    color: var(--color-ink-soft);
    font-size: 0.85rem;
  }

  & button {
    padding: 0.8rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 0.6rem;
    background: white;
    color: var(--color-ink);
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
  }

  & button:hover {
    background: var(--color-surface-muted);
  }
`;

export const field = css`
  label: ConditionPanel-field;
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  border: 0;

  & legend {
    margin-bottom: 0.5rem;
    padding: 0;
    font-size: 0.85rem;
    font-weight: 700;
  }

  & small {
    color: var(--color-muted);
    font-size: 0.75rem;
  }
`;

export const choices = css`
  label: ConditionPanel-choices;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;

  & button {
    min-width: 0;
    padding: 0.55rem 0.4rem;
    font-size: 0.8rem;
  }
`;

export const select = css`
  label: ConditionPanel-select;
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 0.6rem;
  background: white;
  color: var(--color-ink);
  font-size: 0.85rem;
`;

export const submit = css`
  label: ConditionPanel-submit;
  margin-top: auto;
`;
