import { css } from '@emotion/css';

export const details = css`
  label: StreetMemoDetails-details;
  display: grid;
  gap: 0.75rem;
`;

export const meta = css`
  label: StreetMemoDetails-meta;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.8125rem;
`;

export const preference = css`
  label: StreetMemoDetails-preference;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  color: #fff;
  font-weight: 700;

  &[data-preference='LIKE'] {
    background: var(--color-brand-blue);
  }

  &[data-preference='DISLIKE'] {
    background: var(--color-danger);
  }
`;

export const mine = css`
  label: StreetMemoDetails-mine;
  color: var(--color-muted);
`;

/* 사용자 입력은 텍스트로만 보여주고, 입력한 줄바꿈과 공백을 유지한다. */
export const memo = css`
  label: StreetMemoDetails-memo;
  margin: 0;
  color: var(--color-ink);
  font-size: 0.9375rem;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const error = css`
  label: StreetMemoDetails-error;
  margin: 0;
  color: var(--color-danger);
  font-size: 0.875rem;
`;

export const confirm = css`
  label: StreetMemoDetails-confirm;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;

  & p {
    flex: 1;
    margin: 0;
  }
`;
