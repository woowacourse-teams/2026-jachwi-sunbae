import { css, cx } from '@emotion/css';

export const state = css`
  label: AddressSearchResults-state;
  padding: 2rem 1rem;
  font-size: 0.85rem;
  text-align: center;
  color: var(--color-muted, #868b94);
`;

export const error = css`
  label: AddressSearchResults-error;
  padding: 2rem 1rem;
  font-size: 0.85rem;
  text-align: center;
  color: var(--color-error, #e53e3e);
`;

// 다른 요소의 선택자에서 `.AddressSearchResults-results`로 가리킨다.
export const results = cx(
  css`
    label: AddressSearchResults-results;
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--color-border, #eaebed);
    border-bottom: 1px solid var(--color-border, #eaebed);
    background: var(--color-surface, #fff);
    list-style: none;
  `,
  'AddressSearchResults-results',
);

export const item = css`
  label: AddressSearchResults-item;
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 0;
  border-bottom: 1px solid var(--color-border, #eaebed);
  background: transparent;
  color: var(--color-ink, #212124);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  .AddressSearchResults-results li:last-child & {
    border-bottom: 0;
  }

  &:hover {
    background: var(--color-surface-muted, #f2f3f5);
  }
`;

export const text = css`
  label: AddressSearchResults-text;
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 0.15rem;

  & strong,
  & small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & strong {
    font-size: 0.85rem;
    font-weight: 700;
  }

  & small {
    color: var(--color-muted, #868b94);
    font-size: 0.72rem;
  }
`;
