import type { MapAddress } from '@/features/map/model/Map';
import MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';
import Icon from '@/shared/ui/icon/Icon';
import SearchField from '@/shared/ui/search-field/SearchField';

import type { AddressSearchStatus } from '../../hooks/useAddressSearch';
import type { PropertyLocationStatus } from '../../hooks/usePropertyLocation';

import styles from './PropertyLocationPicker.module.css';

type PropertyLocationPickerProps = {
  location: {
    selected: MapAddress;
    status: PropertyLocationStatus;
    onCenterChange: (latitude: number, longitude: number) => void;
    onMoveToCurrentLocation: () => void;
  };
  search: {
    query: string;
    results: MapAddress[];
    status: AddressSearchStatus;
    onQueryChange: (value: string) => void;
    onSubmit: () => void;
    onClear: () => void;
    onSelect: (result: MapAddress) => void;
  };
};

const PropertyLocationPicker = ({ location, search }: PropertyLocationPickerProps) => (
  <section className={styles.section} aria-label="매물 위치 선택">
    <div className={styles.locationHeader}>
      <strong>위치를 선택해 주세요</strong>
      <button
        type="button"
        className={styles.currentLocationButton}
        aria-label="현재 위치로 이동"
        onClick={location.onMoveToCurrentLocation}
      >
        <Icon name="target" size={18} />
      </button>
    </div>
    <div className={styles.addressSearchArea}>
      <SearchField
        label="주소 검색"
        value={search.query}
        placeholder="도로명 또는 지번 주소를 입력해 주세요"
        onValueChange={search.onQueryChange}
        onSubmit={search.onSubmit}
        onClear={search.onClear}
        renderAsForm={false}
      />
      {search.status === 'loading' && <p className={styles.searchStatus}>주소를 찾는 중이에요.</p>}
      {search.status === 'error' && (
        <p className={styles.errorNotice} role="alert">
          주소를 찾지 못했어요. 다시 시도해 주세요.
        </p>
      )}
      {search.results.length > 0 && (
        <ul className={styles.searchResults} aria-label="주소 검색 결과">
          {search.results.map((result) => (
            <li key={`${result.latitude}-${result.longitude}`}>
              <button type="button" onClick={() => search.onSelect(result)}>
                {result.roadAddress ?? result.jibunAddress ?? result.address}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
    <div className={styles.mapPreview}>
      <MapCanvas
        center={location.selected}
        level={5}
        interactive
        showCenterPin
        onCenterChange={location.onCenterChange}
      />
    </div>
    <p className={styles.selectedAddress} aria-live="polite">
      {location.status === 'loading'
        ? '주소를 확인하는 중이에요.'
        : (location.selected.roadAddress ?? location.selected.jibunAddress ?? '주소를 확인하지 못했어요.')}
    </p>
    {location.status === 'error' && <p className={styles.errorNotice}>지도를 움직여 위치를 다시 선택해 주세요.</p>}
  </section>
);

export default PropertyLocationPicker;
