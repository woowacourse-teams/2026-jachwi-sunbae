import styles from './InfoValue.module.css';

export type InfoValueProps = {
  label: string;
  value: string;
  /** 값이 비었을 때 흐리게 보여 줄 문구. */
  emptyText?: string;
};

/** 라벨과 값을 한 줄로 보여 주는 범용 읽기 전용 UI. */
const InfoValue = ({ label, value, emptyText = '-' }: InfoValueProps) => {
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

export default InfoValue;
