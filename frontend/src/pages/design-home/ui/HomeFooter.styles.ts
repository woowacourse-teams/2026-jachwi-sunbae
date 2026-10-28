import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.HomeFooter-footer`로 가리킨다.
export const footer = cx(
  css`
    label: HomeFooter-footer;
    display: grid;
    justify-items: center;
    gap: 0.6rem;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
    border-top: 1px solid var(--color-border);
    color: var(--color-placeholder);
    font-size: 0.7rem;
    line-height: 1.5;
    text-align: center;

    /* 데스크탑에서는 본문 왼쪽 끝에 맞춰 왼쪽 정렬한다. */
    /* 데스크탑 홈에서는 왼쪽 정렬하고 위 여백을 넓힌다. */
    &[data-align-start='true'] {
      justify-items: start;
      margin-top: 4rem;
      padding-top: 2rem;
      text-align: left;
    }
  `,
  'HomeFooter-footer',
);

export const slogan = css`
  label: HomeFooter-slogan;
  margin: 0;
  color: var(--color-muted);
`;

export const links = css`
  label: HomeFooter-links;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem 1rem;

  & a {
    border-radius: 0.25rem;
    color: var(--color-muted);
    text-decoration: none;
  }

  & a:hover {
    color: var(--color-ink);
    text-decoration: underline;
    text-underline-offset: 0.15rem;
  }

  & a:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .HomeFooter-footer[data-align-start='true'] & {
    justify-content: flex-start;
  }
`;

export const copyright = css`
  label: HomeFooter-copyright;
  font-size: inherit;
`;
