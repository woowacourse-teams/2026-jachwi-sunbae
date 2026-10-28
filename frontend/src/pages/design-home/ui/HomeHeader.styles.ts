import { css } from '@emotion/css';

export const header = css`
  label: HomeHeader-header;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const home = css`
  label: HomeHeader-home;
  display: block;
  border-radius: 0.75rem;

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 3px;
  }
`;

/* 로고 글자는 나중에 이미지로 바꿀 예정이라 지금은 오리 이미지만 둔다. */
export const logo = css`
  label: HomeHeader-logo;
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
`;

export const profile = css`
  label: HomeHeader-profile;
  display: grid;
  place-items: center;
  border: 0;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  padding: 0;
  background: transparent;
  cursor: pointer;

  & img {
    width: 2.1rem;
    height: 2.1rem;
  }

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 3px;
  }

  @media (hover: hover) {
    &:hover {
      background: var(--color-card-surface-hover);
    }
  }
`;
