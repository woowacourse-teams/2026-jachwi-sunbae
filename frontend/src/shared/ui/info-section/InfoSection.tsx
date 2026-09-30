import type { ReactNode } from 'react';

import DetailSection from '../detail-section/DetailSection';

import styles from './InfoSection.module.css';

type InfoSectionProps = {
  title: string;
  /** 화면에 보이는 제목과 다른 이름으로 섹션을 읽어야 할 때 쓴다. */
  label?: string;
  /** 섹션 헤더 오른쪽에 놓을 편집 링크 등. */
  action?: ReactNode;
  children: ReactNode;
};

/** 값을 읽기만 하는 정보 섹션. 고치는 일은 별도 편집 화면이 맡는다. */
export const InfoSection = ({ title, label, action, children }: InfoSectionProps) => (
  <DetailSection title={title} label={label} action={action}>
    <dl className={styles.summary}>{children}</dl>
  </DetailSection>
);

export type InfoValueProps = {
  label: string;
  value: string;
  /** 값이 비었을 때 흐리게 보여 줄 문구. */
  emptyText?: string;
};

/** 라벨과 값을 한 줄로 보여 주는 읽기 전용 정보 값 UI. */
export const InfoValue = ({ label, value, emptyText = '-' }: InfoValueProps) => {
  const isEmpty = value.trim() === '';

  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd className={styles.value} data-empty={isEmpty || undefined}>
        {isEmpty ? emptyText : value}
      </dd>
    </div>
  );
};

/** 기존 이름과의 호환을 위해 남겨 둔 별칭이다. 새 화면에서는 `InfoValue`를 사용한다. */
export const InfoRow = InfoValue;
