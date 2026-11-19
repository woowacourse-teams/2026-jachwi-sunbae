import { css } from '@emotion/css';
import { Link } from 'react-router-dom';

import { COMPARE_PATH } from '@/shared/lib/navigation/appPaths';

/** 내 기록 목록 오른쪽 위의 `비교하고 PDF로 받기` 링크. 누르면 기록을 골라 비교하고 PDF로 받는 화면으로 간다. */
const RecordCompareLink = ({ compact = false }: { compact?: boolean }) => (
  <div className={compact ? styles.compactRow : styles.row}>
    <Link to={COMPARE_PATH} aria-label="기록 비교하고 PDF로 받기">
      비교하고 PDF로 받기
    </Link>
  </div>
);

const styles = {
  /* 데스크탑 목록 칸은 이미 자기 안쪽 여백(위 1rem, 좌우 1.5rem)이 있어, 링크 줄은 그 위로 0.5rem만 남기고 좌우 여백은 더하지 않는다. */
  compactRow: css`
    label: RecordCompareLink-compactRow;
    display: flex;
    flex: none;
    justify-content: flex-end;
    position: relative;
    z-index: 1;
    margin-top: -0.5rem;
    padding: 0 0 0.75rem;

    & a {
      color: var(--color-brand-blue-ink);
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
    }
    & a:hover {
      text-decoration: underline;
    }
  `,
  row: css`
    label: RecordCompareLink-row;
    display: flex;
    flex: none;
    justify-content: flex-end;
    /* 고른 매물 카드 뒤 바탕(0.5rem)이 바로 아래 줄을 덮지 않도록 아래 여백을 두고 한 겹 위에 둔다. */
    position: relative;
    z-index: 1;
    padding: 0.6rem 1.25rem 1rem;

    & a {
      color: var(--color-brand-blue-ink);
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
    }
    & a:hover {
      text-decoration: underline;
    }
  `,
};

export default RecordCompareLink;
