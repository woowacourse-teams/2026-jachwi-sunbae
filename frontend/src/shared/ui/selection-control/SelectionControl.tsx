import type { ReactNode } from 'react';
import styles from './SelectionControl.module.css';

type SelectionControlProps = {
  type?: 'checkbox' | 'radio';
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  /** 라디오 묶음을 구분하는 이름. checkbox에는 필요 없다. */
  name?: string;
  value?: string;
  /** 라벨 전체에 붙일 클래스. 선택 상태는 data-selected로 내려간다. */
  className?: string;
  /** 체크 표시를 그리는 요소의 클래스. 화면마다 모양이 달라 밖에서 준다. */
  markClassName?: string;
  /** 체크 표시 안에 넣을 내용. 기본은 선택했을 때만 체크 문자. */
  mark?: ReactNode;
  /** 라벨에 붙일 data-* 속성. 화면별 색 구분 등에 쓴다. */
  dataAttributes?: Record<string, string>;
  children?: ReactNode;
};

/**
 * 체크박스·라디오를 화면에서 숨기고 옆의 표시를 대신 보여 주는 선택 컨트롤.
 * 실제 input을 남겨 두어 키보드 이동과 스크린리더 낭독이 그대로 동작한다.
 */
const SelectionControl = ({
  type = 'checkbox',
  checked,
  onSelect,
  disabled = false,
  name,
  value,
  className,
  markClassName,
  mark,
  dataAttributes,
  children,
}: SelectionControlProps) => (
  <label
    className={`${styles.control} ${className ?? ''}`.trim()}
    data-selected={checked || undefined}
    {...dataAttributes}
  >
    <input
      className={styles.input}
      type={type}
      name={name}
      value={value}
      checked={checked}
      disabled={disabled}
      onChange={onSelect}
    />
    {markClassName !== undefined && (
      <span className={markClassName} aria-hidden="true">
        {mark ?? (checked ? '✓' : null)}
      </span>
    )}
    {children}
  </label>
);

export default SelectionControl;
