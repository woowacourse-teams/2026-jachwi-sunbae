import { css } from '@emotion/css';
import { useState } from 'react';

import { Button } from '@/shared/ui/button/Button';
import TextAreaField from '@/shared/ui/text-field/TextAreaField';

import { PREFERENCE_LABELS, type StreetMemoPreference } from '../../model/StreetMemo';

type Props = {
  isSubmitting: boolean;
  submitFailed: boolean;
  onSubmit: (memo: string, preference: StreetMemoPreference) => void;
  onCancel: () => void;
};

const PREFERENCES: StreetMemoPreference[] = ['LIKE', 'DISLIKE'];

/** 찍은 위치에 남길 메모. 좋아요·싫어요는 기본값 없이 꼭 고르게 하고, 내용은 입력한 줄바꿈을 그대로 보낸다. */
const StreetMemoForm = ({ isSubmitting, submitFailed, onSubmit, onCancel }: Props) => {
  const [preference, setPreference] = useState<StreetMemoPreference | null>(null);
  const [memo, setMemo] = useState('');
  const canSubmit = preference !== null && memo.trim().length > 0 && !isSubmitting;
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(memo, preference);
      }}
    >
      <fieldset className={styles.preferences}>
        <legend>이 장소, 어땠어요?</legend>
        {PREFERENCES.map((value) => (
          <button
            key={value}
            type="button"
            className={styles.preference}
            data-preference={value}
            aria-pressed={preference === value}
            onClick={() => setPreference(value)}
          >
            {value === 'LIKE' ? '👍 ' : '👎 '}
            {PREFERENCE_LABELS[value]}
          </button>
        ))}
      </fieldset>
      <TextAreaField
        label="메모"
        variant="box"
        className={styles.memo}
        placeholder="예: 늦게까지 여는 세탁소가 있어요"
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
      />
      {submitFailed && (
        <p className={styles.error} role="alert">
          메모를 남기지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? '남기는 중…' : '메모 남기기'}
        </Button>
      </div>
    </form>
  );
};

const styles = {
  form: css`
    label: StreetMemoForm-form;
    display: grid;
    gap: 1rem;
  `,

  preferences: css`
    label: StreetMemoForm-preferences;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: 0;

    & legend {
      margin-bottom: 0.5rem;
      color: var(--color-ink-soft);
      font-size: 0.875rem;
      font-weight: 650;
    }
  `,

  preference: css`
    label: StreetMemoForm-preference;
    min-height: 3rem;
    border: 1px solid var(--color-border-strong);
    border-radius: 0.75rem;
    background: var(--color-surface);
    color: var(--color-ink);
    font-size: 0.9375rem;
    font-weight: 700;
    cursor: pointer;

    &[aria-pressed='true'][data-preference='LIKE'] {
      border-color: var(--color-brand-blue);
      background: var(--color-brand-blue);
      color: #fff;
    }

    &[aria-pressed='true'][data-preference='DISLIKE'] {
      border-color: var(--color-danger);
      background: var(--color-danger);
      color: #fff;
    }
  `,

  memo: css`
    label: StreetMemoForm-memo;
    min-height: 6rem;
    resize: vertical;
  `,

  error: css`
    label: StreetMemoForm-error;
    margin: 0;
    color: var(--color-danger);
    font-size: 0.875rem;
  `,

  actions: css`
    label: StreetMemoForm-actions;
    display: flex;
    gap: 0.5rem;

    & > * {
      flex: 1;
    }
  `,
};

export default StreetMemoForm;
