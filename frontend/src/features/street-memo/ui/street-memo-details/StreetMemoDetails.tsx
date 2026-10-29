import { css } from '@emotion/css';
import { useState } from 'react';

import { Button } from '@/shared/ui/button/Button';

import { PREFERENCE_LABELS, type StreetMemo } from '../../model/StreetMemo';

type Props = {
  memo: StreetMemo;
  isRemoving: boolean;
  removeFailed: boolean;
  onRemove: () => void;
};

/** 지도에서 고른 메모. 작성자는 드러내지 않고, 본인 메모일 때만 한 번 더 물어본 뒤 지운다. */
const StreetMemoDetails = ({ memo, isRemoving, removeFailed, onRemove }: Props) => {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className={styles.details}>
      <p className={styles.meta}>
        <span className={styles.preference} data-preference={memo.preference}>
          {memo.preference === 'LIKE' ? '👍 ' : '👎 '}
          {PREFERENCE_LABELS[memo.preference]}
        </span>
        {memo.isMine && <span className={styles.mine}>내가 남긴 메모</span>}
      </p>
      <p className={styles.memo}>{memo.memo}</p>
      {removeFailed && (
        <p className={styles.error} role="alert">
          메모를 지우지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      {memo.isMine &&
        (confirming ? (
          <div className={styles.confirm}>
            <p>이 메모를 지울까요?</p>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={isRemoving}>
              취소
            </Button>
            <Button variant="danger" onClick={onRemove} disabled={isRemoving}>
              {isRemoving ? '지우는 중…' : '지우기'}
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            메모 지우기
          </Button>
        ))}
    </div>
  );
};

const styles = {
  details: css`
    label: StreetMemoDetails-details;
    display: grid;
    gap: 0.75rem;
  `,

  meta: css`
    label: StreetMemoDetails-meta;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.8125rem;
  `,

  preference: css`
    label: StreetMemoDetails-preference;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-weight: 700;

    /* 지도 말풍선과 같은 옅은 바탕·진한 글자 색을 쓴다. */
    &[data-preference='LIKE'] {
      background: var(--color-memo-like);
      color: var(--color-memo-like-ink);
    }

    &[data-preference='DISLIKE'] {
      background: var(--color-memo-dislike);
      color: var(--color-memo-dislike-ink);
    }
  `,

  mine: css`
    label: StreetMemoDetails-mine;
    color: var(--color-muted);
  `,

  /* 사용자 입력은 텍스트로만 보여주고, 입력한 줄바꿈과 공백을 유지한다. */
  memo: css`
    label: StreetMemoDetails-memo;
    margin: 0;
    color: var(--color-ink);
    font-size: 0.9375rem;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  `,

  error: css`
    label: StreetMemoDetails-error;
    margin: 0;
    color: var(--color-danger);
    font-size: 0.875rem;
  `,

  confirm: css`
    label: StreetMemoDetails-confirm;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;

    & p {
      flex: 1;
      margin: 0;
    }
  `,
};

export default StreetMemoDetails;
