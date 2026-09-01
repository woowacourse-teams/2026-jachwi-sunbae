import type { ReactNode } from 'react';
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
  <section className={styles.section} aria-label={label ?? title}>
    <div className={styles.sectionHeader}>
      <h2>{title}</h2>
      {action}
    </div>
    <dl className={styles.summary}>{children}</dl>
  </section>
);

type InfoRowProps = {
  label: string;
  value: string;
  /** 값이 비었을 때 흐리게 보여 줄 문구. */
  emptyText?: string;
};

export const InfoRow = ({ label, value, emptyText = '입력하지 않았어요' }: InfoRowProps) => {
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
