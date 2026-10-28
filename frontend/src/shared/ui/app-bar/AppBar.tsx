import { css } from '@emotion/css';
import { Link } from 'react-router-dom';

import Icon from '../icon/Icon';

type AppBarProps = {
  /** 가운데에 둘 화면 제목. 없으면 뒤로 가기만 둔다. */
  title?: string;
  backLabel: string;
} & ({ backTo: string; onBack?: never } | { onBack: () => void; backTo?: never });

/** 휴대폰 상단 바. 왼쪽 "<" 뒤로 가기와 가운데 제목으로, 앱 셸과 앱 셸 밖 화면(개인정보 처리방침 등)이 함께 쓴다. */
const AppBar = ({ title, backLabel, backTo, onBack }: AppBarProps) => (
  <header className={styles.bar}>
    {backTo !== undefined ? (
      <Link to={backTo} className={styles.back} aria-label={backLabel}>
        <Icon name="chevron-left" size={24} />
      </Link>
    ) : (
      <button type="button" className={styles.back} aria-label={backLabel} onClick={onBack}>
        <Icon name="chevron-left" size={24} />
      </button>
    )}
    {title && <h1 className={styles.title}>{title}</h1>}
  </header>
);

const styles = {
  bar: css`
    label: AppBar-bar;
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    height: 3.25rem;
    padding: env(safe-area-inset-top) 1rem 0;
    background: var(--color-canvas);
  `,

  /* 화면 제목은 "<" 위치와 관계없이 상단 바 가운데에 둔다. */
  title: css`
    label: AppBar-title;
    position: absolute;
    left: 50%;
    margin: 0;
    font-size: 0.98rem;
    transform: translateX(-50%);
    pointer-events: none;
  `,

  back: css`
    label: AppBar-back;
    display: inline-flex;
    align-items: center;
    margin-left: -0.35rem;
    padding: 0.25rem 0.35rem;
    border: 0;
    border-radius: 0.75rem;
    background: none;
    color: var(--color-ink);
    text-decoration: none;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,
};

export default AppBar;
