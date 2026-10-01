import type { MapAddress } from '@/features/map/model/Map';
import Icon from '@/shared/ui/icon/Icon';
import SearchField from '@/shared/ui/search-field/SearchField';

import styles from './MapAddressSearch.module.css';

type SearchStatus = 'idle' | 'loading' | 'error';

type MapAddressSearchProps = {
  isOpen: boolean;
  locationLabel: string;
  query: string;
  results: MapAddress[];
  status: SearchStatus;
  onOpen: () => void;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onSelect: (address: MapAddress) => void;
};

const MapAddressSearch = ({
  isOpen,
  locationLabel,
  query,
  results,
  status,
  onOpen,
  onClose,
  onQueryChange,
  onSubmit,
  onClear,
  onSelect,
}: MapAddressSearchProps) => (
  <>
    <div className={styles.topSearchBar}>
      {isOpen ? (
        <SearchField
          className={styles.activeSearchField}
          label="주소 검색"
          placeholder="도로명 또는 지번 주소 검색"
          value={query}
          shape="pill"
          autoFocus
          showSubmitButton={false}
          onBack={onClose}
          onValueChange={onQueryChange}
          onSubmit={onSubmit}
          onClear={onClear}
        />
      ) : (
        <button type="button" className={styles.searchTrigger} aria-label="주소 또는 위치 검색" onClick={onOpen}>
          <Icon name="search" size={18} />
          <span className={styles.searchPrompt}>{locationLabel}</span>
        </button>
      )}
    </div>

    {isOpen && (
      <section className={styles.searchPageView} aria-label="주소 검색 화면">
        {status === 'loading' && (
          <p className={styles.searchStateText} role="status">
            주소를 찾는 중이에요…
          </p>
        )}
        {status === 'error' && (
          <p className={styles.searchErrorText} role="alert">
            주소를 찾지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        {status === 'idle' && query.trim() !== '' && results.length === 0 && (
          <p className={styles.searchStateText}>검색 결과가 없어요.</p>
        )}
        {results.length > 0 && (
          <ul className={styles.searchResultsList} aria-label="주소 검색 결과">
            {results.map((result) => {
              const primary = result.roadAddress ?? result.jibunAddress ?? result.address ?? '주소 정보 없음';
              const secondary =
                result.roadAddress !== null && result.jibunAddress !== null ? result.jibunAddress : null;

              return (
                <li key={`${result.latitude}-${result.longitude}`}>
                  <button type="button" className={styles.searchResultItem} onClick={() => onSelect(result)}>
                    <Icon name="locate" size={18} />
                    <span className={styles.searchResultText}>
                      <strong>{primary}</strong>
                      {secondary !== null && <small>{secondary}</small>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    )}
  </>
);

export default MapAddressSearch;
