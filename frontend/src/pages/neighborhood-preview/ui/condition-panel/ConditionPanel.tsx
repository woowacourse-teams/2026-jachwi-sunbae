import { css } from '@emotion/css';

import { Button } from '@/shared/ui/button/Button';

import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import { MINUTE_OPTIONS, RENT_OPTIONS } from '../../NeighborhoodFilters';

type ConditionPanelProps = {
  preview: Pick<
    NeighborhoodPreviewContext,
    | 'hasChosenMapPoint'
    | 'mapCandidate'
    | 'isSearching'
    | 'searchError'
    | 'addressResults'
    | 'selectAddress'
    | 'maxMinutes'
    | 'changeMaxMinutes'
    | 'maxTransfers'
    | 'changeMaxTransfers'
    | 'maxRent'
    | 'changeMaxRent'
    | 'isValidCommuteTime'
  >;
  disabled: boolean;
  onSubmit: () => void;
};

/**
 * 데스크탑 동네 찾기의 왼쪽 칸. 휴대폰은 지도 위 칩과 바텀시트로 조건을 고르지만,
 * 데스크탑은 본 방 기록처럼 왼쪽 칸에 출퇴근 장소·조건·찾기 버튼을 펼쳐 두고 지도는 위치를 찍는 데만 쓴다.
 */
const ConditionPanel = ({ preview, disabled, onSubmit }: ConditionPanelProps) => (
  <aside className={styles.panel} aria-label="탐색 조건">
    <h2>어디로 출퇴근·통학하세요?</h2>
    <section className={styles.place} aria-label="출퇴근 장소">
      {preview.hasChosenMapPoint ? (
        <>
          <small>출퇴근 장소</small>
          <strong>{preview.mapCandidate.name}</strong>
        </>
      ) : (
        <p>위에서 학교·회사를 검색하거나 지도에서 위치를 골라주세요.</p>
      )}
    </section>
    {!preview.hasChosenMapPoint &&
      (preview.isSearching || preview.searchError || preview.addressResults.length > 0) && (
        <div className={styles.addresses}>
          {preview.isSearching && <p role="status">주소를 찾고 있어요.</p>}
          {preview.searchError && <p role="alert">{preview.searchError}</p>}
          {preview.addressResults.map((address) => (
            <button
              type="button"
              key={`${address.latitude}-${address.longitude}`}
              onClick={() => preview.selectAddress(address)}
            >
              {address.roadAddress ?? address.jibunAddress ?? address.address}
            </button>
          ))}
        </div>
      )}
    <fieldset className={styles.field} disabled={disabled}>
      <legend>통근 시간</legend>
      <div className={styles.choices} role="radiogroup" aria-label="최대 통근 시간">
        {MINUTE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            role="radio"
            aria-checked={preview.maxMinutes === option.value}
            variant={preview.maxMinutes === option.value ? 'soft' : 'secondary'}
            onClick={() => preview.changeMaxMinutes(option.value)}
          >
            {option.value}분
          </Button>
        ))}
      </div>
    </fieldset>
    <fieldset className={styles.field} disabled={disabled}>
      <legend>환승 횟수</legend>
      <div className={styles.choices} role="radiogroup" aria-label="최대 환승 횟수">
        {[0, 1, 2].map((count) => (
          <Button
            key={count}
            role="radio"
            aria-checked={preview.maxTransfers === count}
            variant={preview.maxTransfers === count ? 'soft' : 'secondary'}
            onClick={() => preview.changeMaxTransfers(count)}
          >
            {count === 0 ? '환승 없음' : `${count}회 이하`}
          </Button>
        ))}
      </div>
    </fieldset>
    <fieldset className={styles.field} disabled={disabled}>
      <legend>월세 시세</legend>
      <select
        className={styles.select}
        aria-label="최대 월세 시세"
        value={preview.maxRent}
        onChange={(event) => preview.changeMaxRent(Number(event.target.value))}
      >
        {RENT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <small>최근 6개월 실거래 월세 중앙값으로 걸러요.</small>
    </fieldset>
    <Button
      className={styles.submit}
      fullWidth
      disabled={disabled || !preview.hasChosenMapPoint || !preview.isValidCommuteTime}
      onClick={onSubmit}
    >
      이 조건으로 동네 찾기
    </Button>
  </aside>
);

const styles = {
  panel: css`
    label: ConditionPanel-panel;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-height: 0;
    overflow-y: auto;
    padding: 1.25rem 1.5rem 1.5rem;
    background: white;

    & h2 {
      margin: 0;
      font-size: 1.1rem;
      letter-spacing: -0.02em;
    }
  `,

  place: css`
    label: ConditionPanel-place;
    display: grid;
    gap: 0.25rem;
    padding: 0.9rem 1rem;
    border-radius: 0.7rem;
    background: var(--color-card-surface);

    & small {
      color: var(--color-muted);
      font-size: 0.75rem;
    }

    & strong {
      font-size: 0.95rem;
    }

    & p {
      margin: 0;
      color: var(--color-ink-soft);
      font-size: 0.85rem;
      line-height: 1.5;
    }
  `,

  addresses: css`
    label: ConditionPanel-addresses;
    display: grid;
    gap: 0.4rem;

    & p {
      margin: 0;
      color: var(--color-ink-soft);
      font-size: 0.85rem;
    }

    & button {
      padding: 0.8rem 0.9rem;
      border: 1px solid var(--color-border);
      border-radius: 0.6rem;
      background: white;
      color: var(--color-ink);
      font-size: 0.85rem;
      text-align: left;
      cursor: pointer;
    }

    & button:hover {
      background: var(--color-surface-muted);
    }
  `,

  field: css`
    label: ConditionPanel-field;
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: 0;

    & legend {
      margin-bottom: 0.5rem;
      padding: 0;
      font-size: 0.85rem;
      font-weight: 700;
    }

    & small {
      color: var(--color-muted);
      font-size: 0.75rem;
    }
  `,

  choices: css`
    label: ConditionPanel-choices;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;

    & button {
      min-width: 0;
      padding: 0.55rem 0.4rem;
      font-size: 0.8rem;
    }
  `,

  select: css`
    label: ConditionPanel-select;
    width: 100%;
    padding: 0.7rem 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: 0.6rem;
    background: white;
    color: var(--color-ink);
    font-size: 0.85rem;
  `,

  submit: css`
    label: ConditionPanel-submit;
    margin-top: auto;
  `,
};

export default ConditionPanel;
