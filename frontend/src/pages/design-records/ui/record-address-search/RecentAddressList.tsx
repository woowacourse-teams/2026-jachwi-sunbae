import { css } from '@emotion/css';

import { recentAddressLabel } from '@/features/map/lib/recentAddressStore';
import type { MapAddress } from '@/features/map/model/Map';
import { addressDropdownClass } from '@/features/map/ui/address-search-results/AddressSearchResults';
import Icon from '@/shared/ui/icon/Icon';

type Props = {
  recents: MapAddress[];
  onSelect: (address: MapAddress) => void;
  onRemove: (address: MapAddress) => void;
  onClear: () => void;
};

/** 입력이 비어 있을 때 검색창 아래에 띄우는 최근 검색. 항목마다 지우기 x를, 머리에 전체 지우기를 둔다. 비면 그리지 않는다. */
const RecentAddressList = ({ recents, onSelect, onRemove, onClear }: Props) => {
  if (recents.length === 0) return null;
  return (
    <section className={`${addressDropdownClass()} ${styles.root}`} aria-label="최근 검색">
      <div className={styles.head}>
        <h2>최근 검색</h2>
        <button type="button" onClick={onClear}>
          전체 지우기
        </button>
      </div>
      <ul>
        {recents.map((address) => {
          const label = recentAddressLabel(address);
          return (
            <li key={label}>
              <button type="button" className={styles.item} onClick={() => onSelect(address)}>
                <Icon name="search" size={16} />
                <span>{label}</span>
              </button>
              <button
                type="button"
                className={styles.remove}
                aria-label={`${label} 기록 지우기`}
                onClick={() => onRemove(address)}
              >
                <Icon name="close" size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const styles = {
  root: css`
    label: RecentAddressList-root;

    & ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    & li {
      display: flex;
      align-items: center;
      border-top: 1px solid var(--color-border, #eaebed);
    }
  `,
  head: css`
    label: RecentAddressList-head;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1rem;

    & h2 {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 700;
    }
    & button {
      padding: 0.25rem 0;
      border: 0;
      background: none;
      color: var(--color-muted, #868b94);
      font: inherit;
      font-size: 0.75rem;
      cursor: pointer;
    }
  `,
  item: css`
    label: RecentAddressList-item;
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 0 0.75rem 1rem;
    border: 0;
    background: transparent;
    color: var(--color-ink, #212124);
    font: inherit;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;

    & span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  remove: css`
    label: RecentAddressList-remove;
    display: grid;
    flex: none;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    border: 0;
    background: transparent;
    color: var(--color-muted, #868b94);
    cursor: pointer;
  `,
};

export default RecentAddressList;
