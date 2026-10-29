import { css } from '@emotion/css';
import { useEffect } from 'react';

import useAddressSearch from '@/features/map/api/useAddressSearch';
import type { MapAddress } from '@/features/map/model/Map';
import AddressSearchResults from '@/features/map/ui/address-search-results/AddressSearchResults';
import Icon from '@/shared/ui/icon/Icon';
import SearchField from '@/shared/ui/search-field/SearchField';

type MapAddressSearchPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: MapAddress) => void;
};

const MapAddressSearchPanel = ({ isOpen, onClose, onSelect }: MapAddressSearchPanelProps) => {
  const { query, results, status, changeQuery, submit, clear } = useAddressSearch();
  useEffect(() => {
    if (!isOpen) clear();
  }, [isOpen, clear]);
  if (!isOpen) return null;
  return (
    <section className={styles.panel} aria-label="주소로 지도 위치 찾기">
      <div className={styles.heading}>
        <strong>주소로 찾기</strong>
        <button type="button" aria-label="주소 검색 닫기" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>
      <SearchField
        label="주소 검색"
        value={query}
        placeholder="도로명 또는 지번 주소"
        onValueChange={changeQuery}
        onSubmit={() => void submit()}
      />
      <AddressSearchResults
        results={results}
        status={status}
        onSelect={(address) => {
          onSelect(address);
          onClose();
        }}
      />
    </section>
  );
};

const styles = {
  panel: css`
    label: MapAddressSearchPanel-panel;
    position: absolute;
    z-index: 24;
    top: 0.75rem;
    left: 0.75rem;
    display: grid;
    width: min(calc(100% - 5rem), 18rem);
    max-height: calc(100% - 1.5rem);
    gap: 0.55rem;
    overflow: auto;
    padding: 0.75rem;
    border: 1px solid rgb(225 226 218 / 92%);
    border-radius: 1rem;
    background: var(--color-surface);
    box-shadow: 0 0.5rem 1.6rem rgb(42 48 35 / 20%);
  `,

  heading: css`
    label: MapAddressSearchPanel-heading;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;

    & > button {
      display: grid;
      width: 1.9rem;
      height: 1.9rem;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--color-ink);
      cursor: pointer;
      place-items: center;
    }
  `,
};

export default MapAddressSearchPanel;
