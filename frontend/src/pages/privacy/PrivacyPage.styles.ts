import { css, cx } from '@emotion/css';

/* 마이와 같은 흰 바탕·회색 카드. 읽기 화면이라 넓은 화면에서도 본문은 40rem까지만 넓힌다. */
export const page = css`
  label: PrivacyPage-page;
  height: 100%;
  overflow-y: auto;
  background: var(--color-canvas);
`;

export const content = css`
  label: PrivacyPage-content;
  width: min(100%, 40rem);
  margin: 0 auto;
  padding: 0 1rem calc(2rem + env(safe-area-inset-bottom));
`;

export const section = css`
  label: PrivacyPage-section;
  padding: 1.4rem 0 1rem;

  & h1 {
    margin: 0;
    font-size: 1.35rem;
    line-height: 1.35;
    letter-spacing: -0.04em;
    word-break: keep-all;
  }

  & > p:last-child {
    margin-top: 1rem;
  }
`;

export const eyebrow = css`
  label: PrivacyPage-eyebrow;
  margin: 0 0 0.35rem;
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 800;
`;

// 다른 요소의 선택자에서 `.PrivacyPage-card`로 가리킨다.
export const card = cx(
  css`
    label: PrivacyPage-card;

    & p,
    & li {
      margin-top: 1rem;
    }

    & {
      margin-top: 0.8rem;
      padding: 1.15rem;
      border-radius: var(--radius-card);
      background: var(--color-card-surface);
    }

    & h2 {
      margin: 0;
      font-size: 0.9rem;
    }

    & ul {
      display: grid;
      gap: 0.35rem;
      margin: 0.7rem 0;
      padding-left: 1.2rem;
    }

    & p {
      margin: 0.65rem 0 0;
    }
  `,
  'PrivacyPage-card',
);

export const mailButton = css`
  label: PrivacyPage-mailButton;
  margin-top: 1rem;
`;

export const externalNotice = css`
  label: PrivacyPage-externalNotice;
  color: var(--color-muted);
  font-size: 0.72rem;
  line-height: 1.65;
  margin: 1rem 0 0;

  & a {
    color: var(--color-primary-dark);
    font-weight: 750;
  }
`;

export const strongNotice = css`
  label: PrivacyPage-strongNotice;

  .PrivacyPage-card & {
    color: var(--color-primary-dark);
    font-weight: 750;
  }
`;

export const status = css`
  label: PrivacyPage-status;

  .PrivacyPage-card & {
    padding: 0.65rem 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-brand);
    color: var(--color-primary-dark);
    font-weight: 750;
  }
`;

export const actions = css`
  label: PrivacyPage-actions;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 0.55rem;
  margin-top: 0.8rem;

  & button {
    min-height: 2.7rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 750;
    cursor: pointer;
  }
`;
