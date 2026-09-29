import { useState } from 'react';
import { searchAddress } from '../../../../features/map/api/mapApi';
import type { MapAddress } from '../../../../features/map/model/Map';
import type { PublicConfig } from '../../../../shared/config/publicConfigTypes';
import InlineNotice from '../../../../shared/ui/inline-notice/InlineNotice';
import SearchField from '../../../../shared/ui/search-field/SearchField';
import Icon from '../../../../shared/ui/icon/Icon';
import styles from './MapAddressSearchPanel.module.css';

type MapAddressSearchPanelProps = {
  config: PublicConfig;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: MapAddress) => void;
};

const MapAddressSearchPanel = ({ config, isOpen, onClose, onSelect }: MapAddressSearchPanelProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapAddress[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  if (!isOpen) return null;

  const submitSearch = async () => {
    if (query.trim() === '') return;
    setStatus('loading');
    try {
      setResults(await searchAddress(config, query.trim()));
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

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
        onValueChange={setQuery}
        onSubmit={() => void submitSearch()}
        onClear={() => {
          setResults([]);
          setStatus('idle');
        }}
      />
      {status === 'loading' && <p role="status">주소를 찾는 중이에요.</p>}
      {status === 'error' && <InlineNotice tone="error">주소를 찾지 못했어요. 다시 시도해 주세요.</InlineNotice>}
      {status === 'idle' && query.trim() !== '' && results.length === 0 && <p>검색 결과가 없어요.</p>}
      {results.length > 0 && (
        <ul aria-label="주소 검색 결과">
          {results.map((result) => (
            <li key={`${result.latitude}-${result.longitude}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(result);
                  onClose();
                }}
              >
                <strong>{result.roadAddress ?? result.jibunAddress}</strong>
                {result.roadAddress !== null && result.jibunAddress !== null && <span>{result.jibunAddress}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MapAddressSearchPanel;
