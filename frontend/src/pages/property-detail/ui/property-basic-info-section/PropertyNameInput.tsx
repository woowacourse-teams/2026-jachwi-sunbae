import { css } from '@emotion/css';
import { type KeyboardEvent, useRef, useState } from 'react';

import { useUpdateProperty } from '@/features/property/api/usePropertyMutations';
import type { PropertyDetail } from '@/features/property/model/Property';

const MAX_NAME_LENGTH = 30;

type Props = {
  property: PropertyDetail;
  /** 저장했거나 취소해 입력을 닫을 때 부른다. */
  onDone: () => void;
};

/**
 * 상세 기본 정보의 매물 이름을 그 줄 안에서 바로 고친다.
 * 엔터나 다른 곳을 누르면 저장하고, Esc는 고치지 않고 닫는다. 비우면 원래 이름으로 되돌린다.
 */
const PropertyNameInput = ({ property, onDone }: Props) => {
  const updateProperty = useUpdateProperty(property.propertyId);
  const [name, setName] = useState(property.name);
  // 엔터로 저장한 뒤 따라오는 blur, Esc로 닫을 때의 blur에서 다시 저장하지 않는다.
  const settledRef = useRef(false);

  const save = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    const next = name.trim();
    if (next === '' || next === property.name) {
      onDone();
      return;
    }
    updateProperty
      .mutateAsync({ current: property, changes: { name: next } })
      .then(onDone)
      .catch(() => {
        // 실패하면 입력을 열어 둔 채 다시 저장할 수 있게 한다.
        settledRef.current = false;
      });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합을 끝내는 엔터는 저장으로 보지 않는다.
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    } else if (event.key === 'Escape') {
      settledRef.current = true;
      onDone();
    }
  };

  return (
    <span className={styles.wrap}>
      <input
        className={styles.input}
        aria-label="매물 이름"
        value={name}
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        readOnly={updateProperty.isPending}
        enterKeyHint="done"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={save}
      />
      {updateProperty.isError && (
        <span className={styles.error} role="alert">
          이름을 저장하지 못했어요. 다시 시도해 주세요.
        </span>
      )}
    </span>
  );
};

const styles = {
  wrap: css`
    label: PropertyNameInput-wrap;
    display: grid;
    gap: 0.3rem;
  `,

  /* 읽을 때와 같은 글자 크기로 줄 안에 놓고 밑줄로 입력 중임을 보여 준다. */
  input: css`
    label: PropertyNameInput-input;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 0.15rem 0;
    border: 0;
    border-bottom: 1.5px solid var(--color-ink, #212124);
    border-radius: 0;
    background: transparent;
    color: var(--color-ink, #212124);
    font: inherit;
    text-align: center;
    outline: none;
  `,

  error: css`
    label: PropertyNameInput-error;
    color: var(--color-error, #e53e3e);
    font-size: 0.75rem;
  `,
};

export default PropertyNameInput;
