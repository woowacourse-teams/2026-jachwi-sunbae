import { css } from '@emotion/css';

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

const styles = {
  row: css`
    label: InfoValue-row;
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: 0.65rem;
    align-items: center;
    padding: 0.65rem 0;

    & dt {
      margin: 0;
      color: var(--color-muted, #868b94);
      font-size: 0.82rem;
      font-weight: 400;
      line-height: 1.5;
    }

    & dd {
      margin: 0;
      overflow-wrap: anywhere;
      color: var(--color-ink, #212124);
      font-size: 0.85rem;
      font-weight: 400;
      line-height: 1.5;
      text-align: center;
    }
  `,

  value: css`
    label: InfoValue-value;

    /* 값은 읽기 전용이라 hover도 커서 변화도 두지 않는다. */
    &[data-empty='true'] {
      color: var(--color-placeholder, #a8abb0);
      font-weight: 500;
    }
  `,
};

export default InfoValue;
